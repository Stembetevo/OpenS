import axios from 'axios';

export interface ShinamiSponsorResponse {
  txBytes: string;  // Sponsored transaction bytes
  txDigest: string;  // Transaction digest
  signature: string; // Sponsor's signature
  expireAtTime: number; // Expiration timestamp
  expireAfterEpoch: number; // Expiration epoch
}

export interface ShinamiError {
  code: string;
  message: string;
}

export class ShinamiService {
  private apiKey: string;
  private gasApiUrl: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    // Extract region prefix from API key (e.g., 'us1' from 'us1_sui_testnet_...')
    const region = apiKey.split('_')[0];
    // Use regional endpoint like: https://api.us1.shinami.com/gas/v1
    this.gasApiUrl = `https://api.${region}.shinami.com/gas/v1`;
    console.log('Initialized Shinami Gas Station with endpoint:', this.gasApiUrl);
  }

  async sponsorTransactionBlock(txBytes: string, sender: string, gasBudget?: number): Promise<ShinamiSponsorResponse> {
    try {
      console.log('Sponsoring transaction with Shinami...');
      console.log('TX Bytes length:', txBytes.length);
      console.log('Sender:', sender);
      
      // Shinami expects params as: [txBytes, sender, gasBudget (optional)]
      const params: any[] = [txBytes, sender];
      
      if (gasBudget) {
        params.push(gasBudget);
      }
      
      const response = await axios.post(
        this.gasApiUrl,
        {
          jsonrpc: '2.0',
          id: 1,
          method: 'gas_sponsorTransactionBlock',
          params,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': this.apiKey,
          },
        }
      );

      console.log('Shinami response status:', response.status);
      console.log('Shinami response data:', JSON.stringify(response.data, null, 2));

      if (response.data.error) {
        console.error('Shinami API Error:', response.data.error);
        throw new Error(`Shinami API Error: ${response.data.error.message}`);
      }

      if (!response.data.result) {
        throw new Error('No result returned from Shinami');
      }

      return response.data.result;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        if (error.response) {
          console.error('Shinami API Error Response:', error.response.data);
          throw new Error(`Shinami API Error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
        }
        console.error('Shinami Network Error:', error.message);
        throw new Error(`Shinami Network Error: ${error.message}`);
      }
      console.error('Unknown error:', error);
      throw error;
    }
  }
}

export function createShinamiService(): ShinamiService {
  const apiKey = process.env.SHINAMI_GAS_API_KEY;
  if (!apiKey) {
    throw new Error('SHINAMI_GAS_API_KEY environment variable is not set');
  }
  return new ShinamiService(apiKey);
}

