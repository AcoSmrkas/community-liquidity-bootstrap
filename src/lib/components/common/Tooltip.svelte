<script>
    import { selected_wallet, connected_wallet_address, } from '$lib/store/store.ts';

    export let message = "";
    export let show = false; // Add a prop to control the visibility
  </script>
  
<style>
  .tooltip-container {
    position: relative;
    display: inline-block;
  }

  .tooltip-text {
    visibility: hidden;
    width: 280px;
    background-color: var(--forms-bg);
    color: #fff;
    text-align: left;
    border-radius: 12px;
    padding: 10px 15px;
    position: absolute;
    z-index: 1;
    top: 125%;
    right: -55px;
    margin-left: -110px;
    opacity: 0;
    transition: opacity 0.3s, visibility 0.3s;
  }

  @media (max-width: 768px) {
    .tooltip-text {
      right: -55px;
    }
  }

  .tooltip-container[data-show="true"] .tooltip-text {
    visibility: visible;
    opacity: 1;
  }

  ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  li {
    padding: 5px 0;
  }

  .profile-button {
    background-color: #007bff;
    color: #fff;
    border: none;
    padding: 10px 20px;
    border-radius: 5px;
    cursor: pointer;
  }

  .profile-button:hover {
    background-color: #0056b3;
  }
</style>

  <div class="tooltip-container" style="font-family:'Manrope';" data-show={show} on:click={event.stopPropagation}>
    <slot></slot>
  <div class="tooltip-text border-2 border-teal-300">
      <ul>
        {#each message.split('\n') as line}
          <li>{@html line}</li>
        {/each}
      </ul>

      {#if $selected_wallet}
        <a href="/profile"><button style="margin: 0 auto;" class="my-2 mt-3 block btn btn-primary border-0">My Profile</button></a>
      {/if}
    </div>
  </div>
  