<script>
  import '../app.css';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { isAuthenticated, isLoading } from '$lib/stores/auth.js';
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  
  // PWA variables
  let updateAvailable = false;
  let registration = null;
  
  // PWA Service Worker setup
  onMount(async () => {
    if (browser && 'serviceWorker' in navigator) {
      try {
        // Import PWA registration
        const { registerSW } = await import('virtual:pwa-register');
        
        registration = registerSW({
          immediate: true,
          onNeedRefresh() {
            updateAvailable = true;
          },
          onOfflineReady() {
            console.log('App ready to work offline');
          },
          onRegistered(swRegistration) {
            console.log('Service Worker registered:', swRegistration);
          },
          onRegisterError(error) {
            console.error('Service Worker registration failed:', error);
          }
        });
        
      } catch (error) {
        console.error('PWA registration failed:', error);
      }
    }
  });
  
  function updateApp() {
    if (registration) {
      registration.update();
      updateAvailable = false;
      window.location.reload();
    }
  }
  
  // Reactive navigation guard
  $: {
    if (!$isLoading) {
      const isLoginPage = $page.route.id === '/login';
      
      if (!$isAuthenticated && !isLoginPage) {
        goto('/login');
      } else if ($isAuthenticated && isLoginPage) {
        goto('/');
      }
    }
  }
</script>

{#if $isLoading}
  <div class="min-h-screen bg-gray-50 flex items-center justify-center">
    <div class="text-center">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
      <p class="mt-2 text-gray-600">Loading...</p>
    </div>
  </div>
{:else}
  <main>
    <slot />
  </main>
  
  <!-- PWA Update Available Banner -->
  {#if updateAvailable}
    <div class="fixed bottom-4 left-4 right-4 z-50 max-w-md mx-auto">
      <div class="bg-blue-600 text-white rounded-lg p-4 shadow-lg flex items-center justify-between">
        <div class="flex-1">
          <p class="text-sm font-medium">Update Available</p>
          <p class="text-xs opacity-90">A new version of zai is ready</p>
        </div>
        <div class="flex space-x-2">
          <button 
            on:click={() => updateAvailable = false}
            class="text-white/70 hover:text-white transition-colors"
          >
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
            </svg>
          </button>
          <button 
            on:click={updateApp}
            class="bg-white/20 hover:bg-white/30 px-3 py-1 rounded text-xs font-medium transition-colors"
          >
            Update
          </button>
        </div>
      </div>
    </div>
  {/if}
{/if}
