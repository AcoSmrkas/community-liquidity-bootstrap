<script>
    export let type = ''; // 'mintpluslp', 'multiassetlp', or 'crowdfund'
    
    const typeConfig = {
        mintpluslp: {
            bg: 'bg-cyan-500/20',
            text: 'text-cyan-400',
            border: 'border-cyan-500/20',
            label: 'Token Mint + LP'
        },
        multiassetlp: {
            bg: 'bg-yellow-500/20',
            text: 'text-white-400',
            border: 'border-purple-500/20',
            label: 'Multi-Asset LP'
        },
        crowdfund: {
            bg: 'bg-yellow-500/20',
            text: 'text-blue-400',
            border: 'border-blue-500/20',
            label: 'Crowdfund'
        }
    };

    $: style = typeConfig[type] || typeConfig.crowdfund;
</script>

<span 
    class="px-3 py-1 rounded-lg text-xs font-medium border transition-colors duration-200 
           {style.bg} {style.text} {style.border}"
>
    {style.label}
</span>

<style>
    span {
        backdrop-filter: blur(4px);
    }
</style>