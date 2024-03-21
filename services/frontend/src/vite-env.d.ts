/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_SIP_SERVER_IP: string;
    readonly VITE_SIP_SERVER_URL: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
