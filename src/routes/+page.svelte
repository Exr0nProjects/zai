<script>
  import { user, authActions } from '$lib/stores/auth.js';
  
  function logout() {
    authActions.logout();
    // Navigation will be handled by the layout guard
  }
</script>

<div class="min-h-screen bg-gray-50">
  <div class="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
    <div class="text-center">
      <h1 class="text-4xl font-bold tracking-tight text-gray-900">
        Welcome to zai
      </h1>
      <p class="mt-4 text-lg text-gray-600">
        Your personal notes app
      </p>
      
      {#if $user}
        <div class="mt-8 bg-white shadow rounded-lg p-6 max-w-md mx-auto">
          <h2 class="text-lg font-medium text-gray-900 mb-4">
            Account Information
          </h2>
          <p class="text-sm text-gray-600 mb-4">
            Signed in as: {$user.phone}
          </p>
          <button
            on:click={logout}
            class="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            Sign Out
          </button>
        </div>
      {/if}
      
      <div class="mt-12">
        <p class="text-sm text-gray-500">
          Notes functionality coming soon...
        </p>
      </div>
    </div>
  </div>
</div>
