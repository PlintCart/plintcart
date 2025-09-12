'use client';

import { isEnokiNetwork, registerEnokiWallets } from '@mysten/enoki';
import { useSuiClientContext } from '@mysten/dapp-kit';
import { useEffect } from 'react';

export function RegisterEnokiWallets() {
  const { client, network } = useSuiClientContext();

  useEffect(() => {
    console.log('🔧 Enoki Registration Debug:');
    console.log('Network:', network);
    console.log('Is Enoki Network:', isEnokiNetwork(network));
    console.log('API Key:', import.meta.env.VITE_PUBLIC_ENOKI_API_KEY ? 'Present' : 'Missing');
    console.log('Google Client ID:', import.meta.env.VITE_PUBLIC_GOOGLE_CLIENT_ID ? 'Present' : 'Missing');
    
    if (!isEnokiNetwork(network)) {
      console.log('❌ Network not supported by Enoki:', network);
      console.log('💡 Try switching to testnet or get a new API key from Enoki Dashboard');
      return;
    }

    console.log('✅ Registering Enoki wallets...');

    const { unregister } = registerEnokiWallets({
      apiKey: import.meta.env.VITE_PUBLIC_ENOKI_API_KEY!,
      providers: {
        google: {
          clientId: import.meta.env.VITE_PUBLIC_GOOGLE_CLIENT_ID!,
          // Use dynamic redirect URL based on environment
          redirectUrl: import.meta.env.DEV 
            ? 'http://localhost:8080'
            : 'https://plintcart.netlify.app',
        },
        // Temporarily disable Facebook to isolate the issue
        // facebook: {
        //   clientId: import.meta.env.VITE_PUBLIC_FACEBOOK_CLIENT_ID!,
        // },
      },
      client,
      network,
    });

    console.log('✅ Enoki wallets registered successfully');
    return unregister;
  }, [client, network]);

  return null;
}