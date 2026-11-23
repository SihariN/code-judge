# Deploying to a server

This guide deploys Code Judge on a single Linux server (Ubuntu LTS) with HTTPS.

> **Read this first.** The judge worker runs other people's code and has access to the
> host's Docker socket, which is equivalent to root on that machine. Use a **dedicated,
> disposable server** that holds nothing else, keep registration **invite-only**, and be
> ready to delete the server if anything looks wrong.

## What you need

- A VPS running Ubuntu LTS with **at least 2 GB of RAM** (building the React app can run out of memory on 1 GB)
- A domain name (or subdomain) whose **A record points to the server's IP address**
- An SSH key pair on your own computer

## 1. Create a non-root user and lock down SSH

Log in as root once, then:

```bash
adduser deploy
usermod -aG sudo deploy
mkdir -p /home/deploy/.ssh
cp ~/.ssh/authorized_keys /home/deploy/.ssh/
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys
```

**In a second terminal**, confirm you can log in as `deploy` with your key before continuing.
Then disable root and password logins. The file name starts with `01-` so it is read before
any provider defaults (OpenSSH uses the first value it finds):

```bash
sudo tee /etc/ssh/sshd_config.d/01-hardening.conf <<'EOF'
PermitRootLogin no
PasswordAuthentication no
EOF
sudo sshd -t && sudo systemctl restart ssh
sudo sshd -T | grep -E 'permitrootlogin|passwordauthentication'
```

The last command should print `permitrootlogin no` and `passwordauthentication no`.

## 2. Firewall and automatic security updates

Allow SSH **before** enabling the firewall, or you will lock yourself out:

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 443/udp
sudo ufw enable
sudo apt update && sudo apt install -y unattended-upgrades
```

## 3. Install Docker

```bash
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
```

Log out and back in, then check `docker --version` and `docker compose version`.

## 4. Get the code and configure it

```bash
git clone https://github.com/SihariN/code-judge.git
cd code-judge
cp .env.example .env
nano .env
```

Set these values (generate secrets with `openssl rand -hex 24`):

```
POSTGRES_PASSWORD=<random>
JWT_SECRET=<random>
INVITE_CODE=<something you will share only with people you trust>
DOMAIN=judge.example.com
COMPOSE_FILE=docker-compose.prod.yml:docker-compose.vps.yml
```

`COMPOSE_FILE` makes a plain `docker compose ...` use both files.

## 5. Start

```bash
docker pull python:3.12-slim
docker compose up -d --build
docker compose run --rm migrate npx prisma db seed
```

Register an account on the site (with the invite code), then promote it:

```bash
docker compose run --rm migrate node scripts/make-admin.js yourusername
```

## 6. Verify

- `https://your-domain` loads with a valid certificate, and `http://` redirects to it
- Register, submit a solution, and watch the verdict arrive live
- From **another computer**, ports 5000, 5433 and 6379 must be unreachable
- `sudo ufw status` shows only 22, 80 and 443

## 7. Operate

```bash
docker compose ps                  # what is running
docker compose logs -f worker      # follow the judge
git pull && docker compose up -d --build   # deploy an update
docker compose exec -T db pg_dump -U judge codejudge | gzip > backup-$(date +%F).sql.gz
```

Emergency switch: `docker compose stop worker` stops all code execution immediately.
Submissions keep queueing and are judged when you start it again.

## 8. If something looks wrong

Stop the worker, take a backup if you want one, and **destroy the server** from your
provider's dashboard. Because it held nothing else, nothing else is lost. Rotate the
invite code and any secrets before redeploying.