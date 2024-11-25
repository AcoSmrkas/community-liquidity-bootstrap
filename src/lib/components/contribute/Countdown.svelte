<script>
    import { Clock } from 'lucide-svelte';
    import { onMount, onDestroy } from 'svelte';

    export let endDate;
    export let startDate;
    export let status;

    let timeLeft = { days: 0, hours: 0, minutes: 0, seconds: 0 };
    let intervalId;
    let shouldShow = false;

    function parseDateTime(dateTimeString) {
        if (!dateTimeString) return null;
        const date = new Date(dateTimeString);
        return isNaN(date.getTime()) ? null : date;
    }

    function calculateTimeLeft() {
        const now = new Date().getTime();
        const start = parseDateTime(startDate)?.getTime();
        const end = parseDateTime(endDate)?.getTime();
        
        if (!start || !end) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
        
        // Determine if we should show the countdown
        if (now < start) {
            shouldShow = true;
            return calculateDifference(now, start);
        } else if (now < end) {
            shouldShow = true;
            return calculateDifference(now, end);
        } else {
            shouldShow = false;
            return { days: 0, hours: 0, minutes: 0, seconds: 0 };
        }
    }

    function calculateDifference(start, end) {
        const difference = end - start;
        
        if (difference <= 0) {
            shouldShow = false;
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

    $: timeString = new Date().getTime() < parseDateTime(startDate)?.getTime() 
        ? 'Starts in:' 
        : 'Ends in:';
</script>

{#if shouldShow}
    <div class="countdown-container">
        <div class="timer-container">
            <div class="timer-header">
                <Clock class="clock-icon" size={16} />
                <span class="timer-label">{timeString}</span>
            </div>
            <div class="time-blocks">
                {#if timeLeft.days > 0}
                    <div class="time-block">
                        <span class="time-value">{timeLeft.days}</span>
                        <span class="time-label">days</span>
                    </div>
                {/if}
                <div class="time-block">
                    <span class="time-value">{timeLeft.hours.toString().padStart(2, '0')}</span>
                    <span class="time-label">hrs</span>
                </div>
                <div class="time-block">
                    <span class="time-value">{timeLeft.minutes.toString().padStart(2, '0')}</span>
                    <span class="time-label">min</span>
                </div>
                <div class="time-block">
                    <span class="time-value">{timeLeft.seconds.toString().padStart(2, '0')}</span>
                    <span class="time-label">sec</span>
                </div>
            </div>
        </div>
    </div>
{/if}

<style>
    .countdown-container {
        width: 100%;
        margin: 0.75rem 0;
    }

    .timer-container {
        background: var(--footer);
        border: 1px solid var(--main-color);
        border-radius: 0.75rem;
        padding: 0.75rem 1rem;
    }

    .timer-header {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 0.5rem;
    }

    .clock-icon {
        color: var(--main-color);
    }

    .timer-label {
        color: var(--main-color);
        font-size: 0.875rem;
        font-weight: 500;
    }

    .time-blocks {
        display: flex;
        justify-content: center;
        gap: 1rem;
    }

    .time-block {
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        min-width: 2.5rem;
    }

    .time-block:not(:last-child)::after {
        content: ':';
        position: absolute;
        right: -0.625rem;
        top: 0;
        color: var(--main-color);
        font-weight: 500;
    }

    .time-value {
        color: white;
        font-size: 1.25rem;
        font-weight: 600;
        line-height: 1;
        font-variant-numeric: tabular-nums;
    }

    .time-label {
        color: var(--main-color);
        font-size: 0.625rem;
        text-transform: uppercase;
        margin-top: 0.25rem;
    }

    @media (max-width: 480px) {
        .timer-container {
            padding: 0.5rem 0.75rem;
        }

        .time-blocks {
            gap: 0.75rem;
        }

        .time-block {
            min-width: 2rem;
        }

        .time-value {
            font-size: 1rem;
        }

        .time-label {
            font-size: 0.5rem;
        }

        .time-block:not(:last-child)::after {
            right: -0.5rem;
        }
    }

    @media (max-width: 360px) {
        .timer-container {
            padding: 0.5rem;
        }

        .time-blocks {
            gap: 0.5rem;
        }

        .time-block {
            min-width: 1.75rem;
        }

        .timer-header {
            margin-bottom: 0.375rem;
        }

        .timer-label {
            font-size: 0.75rem;
        }
    }
</style>