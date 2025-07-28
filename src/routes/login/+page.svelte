<script>
  import { authActions } from '$lib/stores/auth.js';
  import { goto } from '$app/navigation';
  
  let phone = '';
  let otp = '';
  let step = 'phone'; // 'phone' or 'otp'
  let loading = false;
  let error = '';
  
  // Auto-format phone number for proper international format
  function formatPhoneNumber(value) {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    
    // If it starts with 1, assume US number
    if (digits.length === 11 && digits.startsWith('1')) {
      return `+${digits}`;
    }
    // If it's 10 digits, assume US number without country code
    else if (digits.length === 10) {
      return `+1${digits}`;
    }
    // If it already starts with +, keep as is
    else if (value.startsWith('+')) {
      return value;
    }
    // Otherwise, assume US and add +1
    else if (digits.length > 0) {
      return `+1${digits}`;
    }
    
    return value;
  }
  
  function handlePhoneInput(event) {
    const formatted = formatPhoneNumber(event.target.value);
    phone = formatted;
  }
  
  async function sendOTP() {
    if (!phone.trim()) {
      error = 'Please enter your phone number';
      return;
    }
    
    loading = true;
    error = '';
    
    const result = await authActions.sendOTP(phone);
    
    if (result.success) {
      step = 'otp';
      error = ''; // Clear any previous errors
    } else {
      error = result.error;
    }
    
    loading = false;
  }
  
  async function verifyOTP() {
    if (!otp.trim()) {
      error = 'Please enter the OTP code';
      return;
    }
    
    loading = true;
    error = '';
    
    const result = await authActions.verifyOTP(phone, otp);
    
    if (result.success) {
      goto('/');
    } else {
      error = result.error;
    }
    
    loading = false;
  }
  
  function resetForm() {
    step = 'phone';
    phone = '';
    otp = '';
    error = '';
  }
</script>

<svelte:head>
  <title>zai</title>
</svelte:head>

<div class="min-h-screen bg-white flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
  <div class="max-w-sm w-full space-y-8">
    <div class="text-center">
      <h1 class="text-4xl font-light text-gray-900 tracking-wide">
        zai
      </h1>
    </div>

    <form class="mt-12 space-y-6" on:submit|preventDefault={step === 'phone' ? sendOTP : verifyOTP}>
      <div class="space-y-6">
        {#if step === 'phone'}
          <div class="relative">
            <input
              id="phone"
              name="phone"
              type="tel"
              bind:value={phone}
              on:input={handlePhoneInput}
              placeholder="your number?"
              required
              class="w-full px-4 py-3 border-0 border-b-2 border-gray-200 bg-transparent text-lg placeholder-gray-400 text-gray-900 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
        {:else}
          <div class="relative">
            <input
              id="otp"
              name="otp"
              type="text"
              bind:value={otp}
              placeholder="code?"
              required
              maxlength="6"
              class="w-full px-4 py-3 border-0 border-b-2 border-gray-200 bg-transparent text-lg placeholder-gray-400 text-gray-900 focus:outline-none focus:border-blue-500 transition-colors text-center tracking-wider"
            />
          </div>
        {/if}
      </div>

      {#if error}
        <div class="text-red-500 text-sm text-center font-light">
          {error}
        </div>
      {/if}

      <div class="flex flex-col items-center space-y-6">
        <button
          type="submit"
          disabled={loading}
          class="group relative w-16 h-16 flex items-center justify-center rounded-full bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg"
        >
          {#if loading}
            <div class="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
          {:else if step === 'phone'}
            <!-- Up arrow icon for send OTP -->
            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 11l5-5m0 0l5 5m-5-5v12"></path>
            </svg>
          {:else}
            <!-- Right arrow icon for sign in -->
            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
            </svg>
          {/if}
        </button>

        {#if step === 'otp'}
          <button
            type="button"
            on:click={resetForm}
            class="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            back
          </button>
        {/if}
      </div>
    </form>
  </div>
</div> 