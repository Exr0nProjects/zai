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
  <div class="max-w-sm w-full space-y-4">
    <div class="text-center">
      <h1 class="text-4xl font-light text-gray-900 tracking-wide flex items-center justify-center">
        za<span class="opacity-0">i</span><svg class="w-8 h-8 -ml-[1.25rem] mt-[0.05rem]" fill="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="6" r="3" />
          <path d="M12 9L12 21" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
        </svg>
      </h1>
    </div>

    <form class="mt-4 space-y-6" on:submit|preventDefault={step === 'phone' ? sendOTP : verifyOTP}>
      <div class="space-y-6">
        {#if step === 'phone'}
          <!-- Phone pill layout -->
          <div class="flex items-center justify-center">
            <div class="bg-white/90 backdrop-blur-md shadow-lg rounded-full border border-gray-200 flex items-center divide-x divide-gray-200" style="height: 40px;">
              <!-- Phone Input -->
              <input
                id="phone"
                name="phone"
                type="tel"
                bind:value={phone}
                on:input={handlePhoneInput}
                placeholder="your number?"
                required
                class="w-32 h-full px-3 text-sm bg-transparent border-none outline-none focus:ring-0 text-center rounded-l-full"
              />
              
              <!-- Send button -->
              <button
                type="submit"
                disabled={loading}
                class="px-3 h-full text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors rounded-r-full flex items-center"
              >
                {#if loading}
                  <div class="animate-spin rounded-full h-3 w-3 border border-gray-400 border-t-transparent"></div>
                {:else}
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 11l5-5m0 0l5 5m-5-5v12"></path>
                  </svg>
                {/if}
              </button>
            </div>
          </div>
        {:else}
          <!-- OTP pill layout -->
          <div class="flex items-center justify-center">
            <!-- OTP pill container with back button inside -->
            <div class="bg-white/90 backdrop-blur-md shadow-lg rounded-full border border-gray-200 flex items-center divide-x divide-gray-200" style="height: 40px;">
              <!-- Back button -->
              <button
                type="button"
                on:click={resetForm}
                class="px-3 h-full text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors rounded-l-full flex items-center"
              >
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                </svg>
              </button>
              
              <!-- OTP Input -->
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
                class="w-24 h-full px-3 text-sm bg-transparent border-none outline-none focus:ring-0 text-center tracking-wider"
                autocomplete="one-time-code"
              />
              
              <!-- Submit button -->
              <button
                type="submit"
                disabled={loading}
                class="px-3 h-full text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors rounded-r-full flex items-center"
              >
                {#if loading}
                  <div class="animate-spin rounded-full h-3 w-3 border border-gray-400 border-t-transparent"></div>
                {:else}
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                  </svg>
                {/if}
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


    </form>
  </div>
</div> 