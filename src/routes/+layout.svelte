<script>
  import '../app.css';
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { isAuthenticated, isLoading, authActions } from '$lib/stores/auth.js';
  import { isUserAuthenticated } from '$lib/utils/auth.js';
  
  let { children } = $props();
  
  onMount(() => {
    // Initialize auth state
    const authenticated = isUserAuthenticated();
    if (authenticated !== $isAuthenticated) {
      // Sync store with actual auth state
      if (authenticated) {
        // Auth state will be set by the store initialization
      } else {
        authActions.logout();
      }
    }
    
    // Set up navigation guard
    const unsubscribe = page.subscribe(($page) => {
      if (!$isLoading) {
        const isLoginPage = $page.route.id === '/login';
        
        if (!$isAuthenticated && !isLoginPage) {
          goto('/login');
        } else if ($isAuthenticated && isLoginPage) {
          goto('/');
        }
      }
    });
    
    return unsubscribe;
  });
</script>

{#if $isLoading}
  <div class="min-h-screen bg-gray-50 flex items-center justify-center">
    <div class="text-center">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
      <p class="mt-2 text-gray-600">Loading...</p>
    </div>
  </div>
{:else}
  {@render children()}
{/if}
