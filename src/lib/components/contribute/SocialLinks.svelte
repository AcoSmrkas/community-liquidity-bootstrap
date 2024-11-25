<script>
    import { Globe, MessageCircle, Twitter, MessagesSquare } from 'lucide-svelte';
    
    export let socials = {
        website: '',
        telegram: '',
        twitter: '',
        discord: ''
    };
    
    export let accentColor = 'blue'; // 'blue', 'cyan', or 'purple'
    
    const hoverColors = {
        blue: 'hover:text-blue-500',
        cyan: 'hover:text-cyan-500',
        purple: 'hover:text-purple-500'
    };
</script>

{#if socials.website || socials.telegram || socials.twitter || socials.discord}
    <div class="flex justify-center space-x-6 mb-6">
        {#if socials.website}
            <a href={socials.website} 
               target="_blank" 
               rel="noopener noreferrer" 
               class="text-gray-400 {hoverColors[accentColor]} transition-colors">
                <Globe size={20} />
            </a>
        {/if}
        {#if socials.telegram}
            <a href={socials.telegram} 
               target="_blank" 
               rel="noopener noreferrer" 
               class="text-gray-400 {hoverColors[accentColor]} transition-colors">
                <MessageCircle size={20} />
            </a>
        {/if}
        {#if socials.twitter}
            <a href={socials.twitter} 
               target="_blank" 
               rel="noopener noreferrer" 
               class="text-gray-400 {hoverColors[accentColor]} transition-colors">
                <Twitter size={20} />
            </a>
        {/if}
        {#if socials.discord}
            <a href={socials.discord} 
               target="_blank" 
               rel="noopener noreferrer" 
               class="text-gray-400 {hoverColors[accentColor]} transition-colors">
                <MessagesSquare size={20} />
            </a>
        {/if}
    </div>
{/if}