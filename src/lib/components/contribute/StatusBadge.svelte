<script>
    export let status;
    
    const STATUS_STYLES = {
        active: {
            bg: 'bg-gradient-to-r from-green-500 to-green-900',
            text: 'Active'
        },
        upcoming: {
            bg: 'bg-gradient-to-r from-blue-500 to-blue-900',
            text: 'Upcoming'
        },
        ended: {
            bg: 'bg-gradient-to-r from-red-500 to-red-600',
            text: 'Ended'
        },
        inactive: {
            bg: 'bg-gradient-to-r from-gray-500 to-gray-900',
            text: 'Inactive'
        },
        default: {
            bg: 'bg-gradient-to-r from-yellow-500 to-yellow-900',
            text: 'Unknown'
        }
    };

    $: statusStyle = STATUS_STYLES[status] || STATUS_STYLES.default;
</script>

<div class="status-badge {statusStyle.bg}">
    {statusStyle.text}
</div>

<style>
    .status-badge {
        padding: 0.5rem 1rem;
        border-radius: 0.75rem;
        font-size: 0.75rem;
        font-weight: 600;
        color: white;
        text-transform: uppercase;
        letter-spacing: 0.025em;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        backdrop-filter: blur(8px);
        transition: all 0.3s ease;
    }

    .status-badge:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
</style>