<script>
    export let currentAmount;
    export let targetAmount;
    export let tokenName;
    export let accentColor = 'cyan'; // can be 'cyan', 'purple', or 'blue'
    
    $: progress = calculateProgress(currentAmount, targetAmount);
    
    function calculateProgress(current, target) {
        if (!target || !current) return 0;
        return Math.min((current / parseFloat(target)) * 100, 100);
    }

    function formatNumber(num) {
        return num.toLocaleString();
    }

    $: borderColorClass = {
        cyan: 'border-cyan-500',
        purple: 'border-purple-500',
        blue: 'border-blue-500'
    }[accentColor];

    $: progressColorClass = {
        cyan: 'bg-cyan-500',
        purple: 'bg-purple-500',
        blue: 'bg-blue-500'
    }[accentColor];
</script>

<div class="progress-container border-l-4 {borderColorClass}">
    <div class="progress-header">
        <div class="text-gray-400 text-sm">Progress</div>
        <div class="text-white text-sm font-medium">
            {progress.toFixed(2)}%
        </div>
    </div>

    <div class="progress-bar-container">
        <div 
            class="progress-bar {progressColorClass}"
            style="width: {progress}%"
        />
    </div>

    <div class="progress-details">
        <div class="text-gray-400">
            Raisedaaaa: {formatNumber(currentAmount)} {tokenName}
        </div>
        <div class="text-gray-400">
            Target: {formatNumber(targetAmount)} {tokenName}
        </div>
    </div>
</div>

<style>
    .progress-container {
        padding: 1rem;
        background-color: var(--forms-bg);
        border-radius: 0.5rem;
        backdrop-filter: blur(8px);
    }

    .progress-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.5rem;
    }

    .progress-bar-container {
        width: 100%;
        height: 0.5rem;
        background-color: rgba(55, 65, 81, 0.5);
        border-radius: 9999px;
        overflow: hidden;
        margin-bottom: 0.5rem;
    }

    .progress-bar {
        height: 100%;
        border-radius: 9999px;
        transition: width 1s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .progress-details {
        display: flex;
        justify-content: space-between;
        font-size: 0.875rem;
    }

    /* Animation for progress bar */
    .progress-bar {
        animation: shimmer 2s linear infinite;
        background-size: 200% 100%;
    }

    @keyframes shimmer {
        0% {
            background-position: 200% 0;
        }
        100% {
            background-position: -200% 0;
        }
    }
</style>