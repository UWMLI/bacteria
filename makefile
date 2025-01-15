make: build
	
build: run
	
run:
	open ./index.html

deploy:
	rsync -vrc * tyg@theyardgames.org:/httpdocs/game/bacteria --exclude-from rsync-exclude

deploy-test:
	rsync -vrc * tyg@theyardgames.org:/httpdocs/game/bacteria/test --exclude-from rsync-exclude