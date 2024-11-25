<script>
    import { Clock } from 'lucide-svelte';
    import { onMount, onDestroy } from 'svelte';

    export let endDate;
    export let startDate;
    export let status;

    let timeLeft = { days: 0, hours: 0, minutes: 0, seconds: 0 };
    let intervalId;

    function parseDateTime(dateTimeString) {
        if (!dateTimeString) return null;
        
        // Parse "YYYY-MM-DD HH:mm:ss.SSS"
        const date = new Date(dateTimeString);
        return isNaN(date.getTime()) ? null : date;
    }

    function calculateTimeLeft() {
        const now = new Date().getTime();
        const targetDate = status === 'upcoming' ? 
            parseDateTime(startDate)?.getTime() : 
            parseDateTime(endDate)?.getTime();
        
        if (!targetDate) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
        
        const difference = targetDate - now;

        if (difference <= 0) {
            return { days: 0, hours: 0, minutes: 0, seconds: 0 };
        }

        return {
            days: Math.floor(difference / (1000 * 60 * 60 * 24)),
            hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
            minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
            seconds: Math.floor((difference % (1000 * 60)) / 1000)
        };
    }

    function updateTimer() {
        timeLeft = calculateTimeLeft();
    }

    onMount(() => {
        updateTimer();
        intervalId = setInterval(updateTimer, 1000);
    });

    onDestroy(() => {
        if (intervalId) clearInterval(intervalId);
    });

    $: timeString = status === 'upcoming' ? 'Starts in:' : 'Ends in:';
    $: isEnded = status === 'ended' || 
        (timeLeft.days === 0 && timeLeft.hours === 0 && 
         timeLeft.minutes === 0 && timeLeft.seconds === 0);
</script>

<div class="countdown-container">
    {#if isEnded}
        <div class="ended-status">
            <span class="status-text">Campaign Ended</span>
        </div>
    {:else}
        <div class="timer-container">
            <div class="timer-header">
                <Clock size={20} class="clock-icon" />
                <span class="timer-label">{timeString}</span>
            </div>
            <div class="time-units">
                {#if timeLeft.days > 0}
                    <div class="time-unit">
                        <span class="time-value">{timeLeft.days}</span>
                        <span class="time-label">days</span>
                    </div>
                {/if}
                <div class="time-unit">
                    <span class="time-value">{timeLeft.hours.toString().padStart(2, '0')}</span>
                    <span class="time-label">hrs</span>
                </div>
                <div class="time-unit">
                    <span class="time-value">{timeLeft.minutes.toString().padStart(2, '0')}</span>
                    <span class="time-label">min</span>
                </div>
                <div class="time-unit">
                    <span class="time-value">{timeLeft.seconds.toString().padStart(2, '0')}</span>
                    <span class="time-label">sec</span>
                </div>
            </div>
        </div>
    {/if}
</div>

<style>
    .countdown-container {
        margin: 1rem 0;
        font-family: 'Inter', sans-serif;
    }

    .timer-container {
        background: var(--footer);
        border-radius: 12px;
        padding: 1rem 1.5rem;
        border: 1px solid var(--main-color);
    }

    .timer-header {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-bottom: 1rem;
        color: var(--main-color);
    }

    .clock-icon {
        color: var(--main-color);
    }

    .timer-label {
        font-size: 1rem;
        font-weight: 500;
        color: var(--main-color);
    }

    .time-units {
        display: flex;
        gap: 1.5rem;
        align-items: center;
        justify-content: center;
    }

    .time-unit {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.25rem;
        position: relative;
        min-width: 3.5rem;
    }

    .time-unit:not(:last-child)::after {
        content: ':';
        position: absolute;
        right: -1rem;
        top: 25%;
        color: var(--main-color);
        font-weight: 600;
        font-size: 1.5rem;
    }

    .time-value {
        font-size: 2rem;
        font-weight: 700;
        color: white;
        font-variant-numeric: tabular-nums;
        text-align: center;
        line-height: 1;
    }

    .time-label {
        font-size: 0.75rem;
        color: var(--main-color);
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }

    .ended-status {
        background: var(--footer);
        border: 1px solid var(--main-color);
        padding: 1rem;
        border-radius: 12px;
        text-align: center;
    }

    .status-text {
        color: var(--main-color);
        font-weight: 600;
        font-size: 1rem;
    }

    .time-unit:last-child .time-value {
        animation: pulse 1s infinite;
    }

    @keyframes pulse {
        0% { opacity: 1; }
        50% { opacity: 0.7; }
        100% { opacity: 1; }
    }
</style>