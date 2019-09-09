## This file is pseudo-bash that serves as a reminder of the necessary steps to deploy app on a vanilla AWS machine (Ubuntu 18.04)


# Add Postgres PPA
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc |   sudo apt-key add -
sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt/ bionic-pgdg main" >> /etc/apt/sources.list.d/postgresql.list'

# Update package definition and upgrade already installed packages to latest version
apt-get update
apt-get dist-upgrade

# Install necessary packages
apt-get install postgresql postgresql-contrib postgis postgresql-11-postgis-2.5 postgresql-11-postgis-2.5-scripts nodejs npm

# Create user and DB
sudo -u postgres createuser --interactive --pwprompt
sudo -u postgres createdb --encoding=UTF8 --owner=gisuser gis
sudo -u postgres psql --username=postgres --dbname=gis -c "CREATE EXTENSION postgis;"
sudo -u postgres psql --username=postgres --dbname=gis -c "CREATE EXTENSION postgis_topology;"

# Download PG dump from Google Drive. Not necessary if SCP or other sources
apt-get install python-pip
pip install gdown
gdown https://drive.google.com/uc?id=1JinWoKhFUva0QElBFDu0sEdP5eZk4Is_

# Restore data and create index
sudo -u postgres pg_restore -d gis ./pgdump
sudo -u postgres psql --username=postgres --dbname=gis -c "CREATE INDEX line_small_index ON public.line_small USING gist (way);"

# Clone GIT repo
git clone https://github.com/GregoireDelannoy/far-from-road.git
cd far-from-road

# Install NodeJS dependencies
npm install

# Install process manager
npm install pm2 -g

# Set up env for pm2 and set it to start at boot
pm2 init
pm2 startup

# Edit ecosystem.config.js so that it looks like:
module.exports = {
  apps : [{
    name: 'FFR',
    script: 'app.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      PGUSER: '<USER/PASSWORD as defined when creating user>',
      PGPASSWORD: '<USER/PASSWORD as defined when creating user>',
      PGDATABASE: 'gis'
    }
  }]
};

# Start app and set it to start at every boot
pm2 start
pm2 save