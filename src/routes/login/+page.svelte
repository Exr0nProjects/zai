<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { authActions, isAuthenticated } from '$lib/stores/auth.js';
  import { checkOnlineStatus, formatPhoneNumber } from '$lib/utils/auth.js';
  
  let phoneNumber = '';
  let verificationCode = '';
  let step = 'phone'; // 'phone' or 'verify'
  let isLoading = false;
  let error = '';
  let isOnline = true;
  
  onMount(async () => {
    // Check if already authenticated
    if ($isAuthenticated) {
      goto('/');
      return;
    }
    
    // Check online status
    isOnline = await checkOnlineStatus();
    
    // Listen for online/offline events
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => isOnline = true);
      window.addEventListener('offline', () => isOnline = false);
    }
  });
  
  async function sendSMS() {
    if (!isOnline) {
      error = 'You have to log in online';
      return;
    }
    
    if (!phoneNumber.trim()) {
      error = 'Please enter your phone number';
      return;
    }
    
    isLoading = true;
    error = '';
    
    try {
      const formattedPhone = formatPhoneNumber(phoneNumber.trim());
      const result = await authActions.sendOTP(formattedPhone);
      
      if (result.success) {
        step = 'verify';
      } else {
        error = result.error || 'Failed to send verification code';
      }
    } catch (formatError) {
      if (formatError.message.includes('10 digits')) {
        error = 'Please enter a valid phone number (at least 10 digits)';
      } else {
        error = formatError.message || 'Please enter a valid phone number';
      }
    } finally {
      isLoading = false;
    }
  }
  
  async function verifySMS() {
    if (!verificationCode.trim()) {
      error = 'Please enter the verification code';
      return;
    }
    
    isLoading = true;
    error = '';
    
    try {
      const formattedPhone = formatPhoneNumber(phoneNumber.trim());
      const result = await authActions.verifyOTP(formattedPhone, verificationCode.trim());
      
      if (result.success) {
        goto('/');
      } else {
        error = result.error || 'Invalid verification code';
      }
    } catch (formatError) {
      if (formatError.message.includes('10 digits')) {
        error = 'Please enter a valid phone number (at least 10 digits)';
      } else {
        error = formatError.message || 'Please enter a valid phone number';
      }
    } finally {
      isLoading = false;
    }
  }
  
  function goBack() {
    step = 'phone';
    verificationCode = '';
    error = '';
  }
  
  function handleKeyPress(event) {
    if (event.key === 'Enter') {
      if (step === 'phone') {
        sendSMS();
      } else {
        verifySMS();
      }
    }
  }
</script>

<div class="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
  <div class="sm:mx-auto sm:w-full sm:max-w-md">
    <h2 class="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
      Sign in to your account
    </h2>
    <p class="mt-2 text-center text-sm text-gray-600">
      We'll send you a verification code via SMS
    </p>
  </div>

  <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
    <div class="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
      {#if !isOnline}
        <div class="rounded-md bg-red-50 p-4 mb-6">
          <div class="text-sm text-red-700">
            You have to log in online
          </div>
        </div>
      {/if}
      
      {#if error}
        <div class="rounded-md bg-red-50 p-4 mb-6">
          <div class="text-sm text-red-700">
            {error}
          </div>
        </div>
      {/if}

      {#if step === 'phone'}
        <div>
          <label for="phone" class="block text-sm font-medium text-gray-700">
            Phone Number
          </label>
          <div class="mt-1">
            <input
              id="phone"
              type="tel"
              autocomplete="tel"
              required
              bind:value={phoneNumber}
              on:keypress={handleKeyPress}
              placeholder="(781) 570-1234 or +1-781-570-1234"
              disabled={isLoading || !isOnline}
              class="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>
          <p class="mt-2 text-sm text-gray-500">
            Enter your phone number. US numbers will automatically get +1 prefix.
          </p>
        </div>

        <div class="mt-6">
          <button
            type="button"
            on:click={sendSMS}
            disabled={isLoading || !isOnline}
            class="flex w-full justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {#if isLoading}
              Sending...
            {:else}
              Send Verification Code
            {/if}
          </button>
        </div>
        
      {:else if step === 'verify'}
        <div>
          <label for="code" class="block text-sm font-medium text-gray-700">
            Verification Code
          </label>
          <div class="mt-1">
            <input
              id="code"
              type="text"
              inputmode="numeric"
              autocomplete="one-time-code"
              required
              bind:value={verificationCode}
              on:keypress={handleKeyPress}
              placeholder="123456"
              disabled={isLoading}
              class="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>
          <p class="mt-2 text-sm text-gray-500">
            Enter the 6-digit code sent to {phoneNumber}
          </p>
        </div>

        <div class="mt-6 space-y-4">
          <button
            type="button"
            on:click={verifySMS}
            disabled={isLoading}
            class="flex w-full justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {#if isLoading}
              Verifying...
            {:else}
              Verify Code
            {/if}
          </button>
          
          <button
            type="button"
            on:click={goBack}
            disabled={isLoading}
            class="flex w-full justify-center rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            Back
          </button>
        </div>
      {/if}
    </div>
  </div>
</div> 