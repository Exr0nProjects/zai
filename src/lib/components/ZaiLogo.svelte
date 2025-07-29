<script>
  export let size = 'sm'; // 'sm', 'md', 'lg'
  export let color = 'text-gray-600';
  
  const sizeClasses = {
    sm: { text: 'text-sm', icon: 'w-3 h-3', offset: '-ml-[0.55em]', spacing: 'mx-0.5' },
    md: { text: 'text-lg', icon: 'w-4 h-4', offset: '-ml-[0.55em]', spacing: 'mx-1' },
    lg: { text: 'text-4xl', icon: 'w-[1em] h-[1em]', offset: '-ml-[0.55em]', spacing: 'mx-1' }
  };
  
  $: classes = sizeClasses[size] || sizeClasses.sm;
</script>

<span class="font-light tracking-wide flex items-center {color} {classes.text}">
  za<span class="opacity-0">i</span><svg 
    class="w-[0.95em] h-[0.95em] -ml-[0.55em] -mt-[0.025em]" 
    fill="currentColor" 
    viewBox="0 0 24 24"
  >
    <circle cx="12" cy="6" r="3" />
    <path d="M12 9L12 21" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
  </svg>
</span> 