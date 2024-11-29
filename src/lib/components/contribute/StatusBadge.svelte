<script>
    export let status;
   
    const STATUS_STYLES = {
        active: {
            color: '#22c55e', // green
            title: 'Active'
        },
        upcoming: {
            color: '#f97316', // orange
            title: 'Upcoming'
        },
        ended: {
            color: '#ef4444', // red
            title: 'Ended'
        },
        inactive: {
            color: '#6b7280', // gray
            title: 'Inactive'
        },
        default: {
            color: '#eab308', // yellow
            title: 'Unknown'
        }
    };

    $: statusStyle = STATUS_STYLES[status] || STATUS_STYLES.default;
</script>

<div class="status-indicator" title={statusStyle.title}>
    <svg width="12" height="12" viewBox="0 0 12 12" 
    style="color: var(--forms-bg);background: var(--forms-bg);">
        <circle 
            cx="6" 
            cy="6" 
            r="5" 
            fill={statusStyle.color}
            class="status-dot"
        />
    </svg>
    <span class="status-text">{statusStyle.title}</span>
</div>

<style>
    .status-indicator {
        display: inline-flex;
        align-items: center;
        gap: 0.375rem;
        cursor: default;
        padding: 0.25rem;
    }

    .status-dot {
        filter: drop-shadow(0 0 2px currentColor);
    }

    .status-text {
        font-size: 0.75rem;
        color: white;
        font-weight: 500;
    }

    @media (max-width: 640px) {
        .status-text {
            display: none;
        }
    }
</style>