import type { IHttpResponse } from ".";

declare module "vietqr" {
  interface VietQROptions {
    clientID: string;
    apiKey: string;
  }

  interface QRGenerateOptions {
    bank: string;
    accountName: string;
    accountNumber: string;
    amount: string;
    memo: string;
    template?: string;
  }

  interface QRGenerateResult {
    code: string;
    desc: string;
    data: {
      acqId: string;
      accountName: string;
      qrDataURL: string;
    };
  }

  interface BankInfo {
    id: number;
    name: string;
    code: string;
    bin: string;
    isTransfer: number;
    short_name: string;
    logo: string;
    support: number;
  }

  interface BanksResult {
    code: string;
    desc: string;
    data: BankInfo[];
  }

  export class VietQR {
    constructor(options: VietQROptions);
    genQRCodeBase64(
      options: QRGenerateOptions
    ): Promise<IHttpResponse<QRGenerateResult>>;
    getBanks(): Promise<BanksResult>;
    getTemplate(): Promise<any>;
    genQuickLink(options: QRGenerateOptions & { media?: string }): string;
  }
}
