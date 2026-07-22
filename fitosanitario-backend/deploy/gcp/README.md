# Google Cloud deployment

## Runtime

- Project: `project-01900fb5-a41d-424c-940`
- Region: `us-central1`
- Cloud Run: `fitosanitario-backend`
- Data VM: `fitosanitario-data` (`e2-micro`, private IP `10.20.0.10`)
- Network: `fitosanitario-vpc` / `fitosanitario-subnet`
- Artifact Registry: `fitosanitario`

Public API:

`https://fitosanitario-backend-189364885425.us-central1.run.app/api`

Health check:

`https://fitosanitario-backend-189364885425.us-central1.run.app/api/health`

## Data services

PostgreSQL and MinIO run as memory-limited containers on the private VM. They
are reachable only from the VPC. The MinIO console binds to VM localhost.
Secrets are read from Secret Manager by the VM and Cloud Run service accounts.

Connect to the VM through IAP:

```powershell
gcloud compute ssh fitosanitario-data `
  --project=project-01900fb5-a41d-424c-940 `
  --zone=us-central1-a `
  --tunnel-through-iap
```

Check the containers:

```bash
sudo docker ps
sudo docker logs fitosanitario-postgres
sudo docker logs fitosanitario-minio
```

## Cost controls

- Cloud Run: request-based billing, zero minimum and three maximum instances
  (minimum supported while using Direct VPC egress).
- Compute Engine: one `e2-micro` in an Always Free eligible region.
- Disk: 30 GB Standard persistent disk.
- VM: no external IPv4 address.
- Artifact Registry: cleanup keeps two recent images.

## Initial data

The production schema is applied and verified. The deployment intentionally
starts with empty database tables and an empty MinIO bucket.
