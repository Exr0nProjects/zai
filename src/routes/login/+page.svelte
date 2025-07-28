<script>
  import { authActions } from '$lib/stores/auth.js';
  import { goto } from '$app/navigation';
  import { onMount, tick } from 'svelte';
  
  let phone = '';
  let otp = '';
  let step = 'phone'; // 'phone' or 'otp'
  let loading = false;
  let error = '';
  let otpInput;
  
  // Standardize phone number format for consistent user identification
  function standardizePhoneNumber(phone) {
    if (!phone) return phone;
    
    // Remove all non-digits
    const digits = phone.replace(/\D/g, '');
    
    // US phone number logic
    if (digits.length === 10) {
      // 10 digits: add +1 country code
      return `+1${digits}`;
    } else if (digits.length === 11 && digits.startsWith('1')) {
      // 11 digits starting with 1: add + prefix
      return `+${digits}`;
    } else if (phone.startsWith('+') && digits.length >= 10) {
      // Already has + and sufficient digits: use as-is
      return phone;
    } else {
      // Fallback: assume US number and add +1
      return `+1${digits}`;
    }
  }
  
  function handlePhoneInput(event) {
    // Store raw input, standardize only when sending
    phone = event.target.value;
  }
  
  async function sendOTP() {
    if (!phone.trim()) {
      error = 'Please enter your phone number';
      return;
    }
    
    loading = true;
    error = '';
    
    // Standardize phone number only when sending
    const standardizedPhone = standardizePhoneNumber(phone);
    console.log('📱 Sending OTP - Raw:', phone, '→ Standardized:', standardizedPhone);
    
    const result = await authActions.sendOTP(standardizedPhone);
    
    if (result.success) {
      // Update display to show standardized version
      phone = standardizedPhone;
      step = 'otp';
      error = ''; // Clear any previous errors
      
      // Auto-focus OTP input after step changes
      await tick();
      if (otpInput) {
        otpInput.focus();
      }
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
    
    // Use the same standardized phone number
    const result = await authActions.verifyOTP(phone, otp);
    
    if (result.success) {
      goto('/');
    } else {
      error = result.error;
    }
    
    loading = false;
  }
  
  function handleOtpInput(event) {
    otp = event.target.value;
    
    // Auto-submit when 6 characters are entered
    if (otp.length === 6) {
      verifyOTP();
    }
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
          <!-- OTP Input with horizontal layout -->
          <div class="flex items-center space-x-4">
            <input
              bind:this={otpInput}
              id="otp"
              name="otp"
              type="text"
              bind:value={otp}
              on:input={handleOtpInput}
              placeholder="code?"
              required
              maxlength="6"
              class="w-32 px-4 py-3 border-0 border-b-2 border-gray-200 bg-transparent text-lg placeholder-gray-400 text-gray-900 focus:outline-none focus:border-blue-500 transition-colors text-center tracking-wider"
              autocomplete="one-time-code"
            />
            
            <!-- Buttons to the right of input -->
            <div class="flex items-center space-x-2">
              <button
                type="submit"
                disabled={loading}
                class="group relative w-10 h-10 flex items-center justify-center rounded-full bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg"
              >
                {#if loading}
                  <div class="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                {:else}
                  <!-- Right arrow icon for sign in -->
                  <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                  </svg>
                {/if}
              </button>
              
              <button
                type="button"
                on:click={resetForm}
                class="text-sm text-gray-500 hover:text-gray-700 transition-colors px-2 py-1"
              >
                back
              </button>
            </div>
          </div>
        {/if}
      </div>

      {#if error}
        <div class="text-red-500 text-sm text-center font-light">
          {error}
        </div>
      {/if}

      <!-- Only show button for phone step (OTP buttons are inline) -->
      {#if step === 'phone'}
        <div class="flex flex-col items-center space-y-6">
          <button
            type="submit"
            disabled={loading}
            class="group relative w-10 h-10 flex items-center justify-center rounded-full bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg"
          >
            {#if loading}
              <div class="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
            {:else}
              <!-- Up arrow icon for send OTP -->
              <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 11l5-5m0 0l5 5m-5-5v12"></path>
              </svg>
            {/if}
          </button>
        </div>
      {/if}
    </form>
  </div>
</div> 