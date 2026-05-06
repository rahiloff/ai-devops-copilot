import httpx
import re
import time
import asyncio

async def fetch_node_exporter_metrics(url: str) -> dict:
    
    async with httpx.AsyncClient(timeout=5.0) as client:
        # Fetch first sample
        response1 = await client.get(url)
        raw1 = response1.text
        
        # Wait 1 second to calculate real-time rates
        await asyncio.sleep(1.0)
        
        # Fetch second sample
        response2 = await client.get(url)
        raw2 = response2.text
    
    def parse_metric(raw_text: str, metric_name: str) -> float:
        for line in raw_text.split('\n'):
            if line.startswith(metric_name + ' ') or \
               line.startswith(metric_name + '{'):
                if not line.startswith('#'):
                    try:
                        value = float(line.split()[-1])
                        return value
                    except:
                        pass
        return 0.0

    def get_cpu_stats(raw_text: str):
        cpu_idle = 0
        cpu_total = 0
        for line in raw_text.split('\n'):
            if line.startswith('node_cpu_seconds_total{') and not line.startswith('#'):
                try:
                    val = float(line.split()[-1])
                    cpu_total += val
                    if 'mode="idle"' in line:
                        cpu_idle += val
                except:
                    pass
        return cpu_idle, cpu_total

    idle1, total1 = get_cpu_stats(raw1)
    idle2, total2 = get_cpu_stats(raw2)
    
    idle_delta = idle2 - idle1
    total_delta = total2 - total1
    
    cpu_usage_percent = 0.0
    if total_delta > 0:
        cpu_usage_percent = round((1 - idle_delta / total_delta) * 100, 2)
    elif total1 > 0:
        # Fallback to lifetime if delta fails
        cpu_usage_percent = round((1 - idle1 / total1) * 100, 2)

    # Memory (gauge, so we only need raw2)
    mem_total = parse_metric(raw2, 'node_memory_MemTotal_bytes')
    mem_available = parse_metric(raw2, 'node_memory_MemAvailable_bytes')
    mem_used_percent = 0.0
    if mem_total > 0:
        mem_used_percent = round((1 - mem_available / mem_total) * 100, 2)
    mem_used_gb = round((mem_total - mem_available) / (1024**3), 2)
    mem_total_gb = round(mem_total / (1024**3), 2)

    # Disk rates (bytes per second)
    disk_read1 = parse_metric(raw1, 'node_disk_read_bytes_total')
    disk_write1 = parse_metric(raw1, 'node_disk_written_bytes_total')
    disk_read2 = parse_metric(raw2, 'node_disk_read_bytes_total')
    disk_write2 = parse_metric(raw2, 'node_disk_written_bytes_total')
    
    disk_read_bps = max(0, disk_read2 - disk_read1)
    disk_write_bps = max(0, disk_write2 - disk_write1)

    # Network rates (MB per second)
    net_receive1 = parse_metric(raw1, 'node_network_receive_bytes_total')
    net_transmit1 = parse_metric(raw1, 'node_network_transmit_bytes_total')
    net_receive2 = parse_metric(raw2, 'node_network_receive_bytes_total')
    net_transmit2 = parse_metric(raw2, 'node_network_transmit_bytes_total')
    
    net_receive_mbps = round(max(0, net_receive2 - net_receive1) / (1024**2), 2)
    net_transmit_mbps = round(max(0, net_transmit2 - net_transmit1) / (1024**2), 2)

    # Uptime
    boot_time = parse_metric(raw2, 'node_boot_time_seconds')
    uptime_seconds = int(time.time() - boot_time) if boot_time > 0 else 0
    uptime_hours = round(uptime_seconds / 3600, 1)

    # Load Average
    load_1 = parse_metric(raw2, 'node_load1')
    load_5 = parse_metric(raw2, 'node_load5')
    load_15 = parse_metric(raw2, 'node_load15')

    return {
        "cpu_usage_percent": cpu_usage_percent,
        "memory_used_percent": mem_used_percent,
        "memory_used_gb": mem_used_gb,
        "memory_total_gb": mem_total_gb,
        "disk_read_bytes": disk_read_bps,
        "disk_write_bytes": disk_write_bps,
        "network_receive_mb": net_receive_mbps,
        "network_transmit_mb": net_transmit_mbps,
        "uptime_hours": uptime_hours,
        "load_avg_1m": load_1,
        "load_avg_5m": load_5,
        "load_avg_15m": load_15,
        "data_source": "node_exporter",
        "timestamp": time.time()
    }
