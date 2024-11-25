<script>
    export let type = '';
   
    const typeConfig = {
        mintpluslp: {
            bg: 'bg-cyan-500/20',
            text: 'text-cyan-400',
            border: 'border-cyan-500/20',
            label: 'Mint+LP'
        },
        multiassetlp: {
            bg: 'bg-yellow-500/20',
            text: 'text-yellow-400',  // Changed from text-white-400 to text-yellow-400
            border: 'border-yellow-500/20',  // Changed to match yellow theme
            label: 'Multi LP'
        },
        crowdfund: {
            bg: 'bg-blue-500/20',
            text: 'text-blue-400',
            border: 'border-blue-500/20',
            label: 'Fund'
        }
    };
    $: style = typeConfig[type] || typeConfig.crowdfund;
</script>

<span
    class="px-2 py-0.5 rounded text-[10px] font-medium border-[0.5px] uppercase tracking-wide
           {style.bg} {style.text} {style.border}"
>
    {style.label}
</span>

<style>
    span {
        backdrop-filter: blur(4px);
    }
</style>