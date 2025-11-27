# Security Architecture

## Secret Management (AWS KMS + EKS)

We have configured **Envelope Encryption** for Kubernetes Secrets using AWS KMS (Key Management Service). This ensures that sensitive data (like your `GEN_AI_KEY`) is encrypted *at rest* within the Kubernetes database (etcd).

### How it works
You do not need to manually encrypt/decrypt secrets. The process is transparent and handled by the EKS Control Plane:

1.  **Encryption (Write)**:
    *   When you (or GitHub Actions) create a Secret (`kubectl create secret...`), the Kubernetes API Server receives the plain-text data.
    *   The API Server calls AWS KMS to generate a **Data Encryption Key (DEK)**.
    *   The API Server uses this DEK to encrypt your secret.
    *   The encrypted secret + the encrypted DEK are stored in `etcd`.
    *   *Result*: Anyone with physical access to the `etcd` disks sees only garbage data.

2.  **Decryption (Read)**:
    *   When your Pod starts, it requests the Secret.
    *   The API Server reads the encrypted data from `etcd`.
    *   The API Server calls AWS KMS to decrypt the DEK.
    *   The API Server uses the decrypted DEK to decrypt your secret.
    *   The plain-text secret is mounted into your Pod (in memory/tmpfs).

### Your Role
*   **We** (Humans/CI): Just configure the KMS Key in Terraform (Done).
*   **The System**: Automatically handles all encryption/decryption.

## Comparison: KMS vs. AWS Secrets Manager

You asked if **AWS Secrets Manager** is preferred for Enterprise. Here is the breakdown:

| Feature | KMS Encrypted K8s Secrets (Current) | AWS Secrets Manager + External Secrets |
| :--- | :--- | :--- |
| **Security Level** | **High** (Encrypted at rest) | **Very High** (Centralized, Rotation) |
| **Complexity** | **Low** (Native K8s) | **High** (Requires Operator + IAM) |
| **Cost** | KMS Key ($1/mo) | $0.40 per secret / month |
| **Dev Experience** | Standard `kubectl` | Custom CRDs (`ExternalSecret`) |
| **Enterprise Use** | Standard for 90% of companies. | Preferred for FinTech/Gov/Compliance. |

**Verdict**:
*   **KMS** is "Enterprise Ready" and sufficient for most production workloads.
*   **Secrets Manager** is better if you need **automatic rotation** (e.g., changing DB passwords every 30 days) or have strict compliance requirements preventing *any* secret data in Kubernetes etcd.
