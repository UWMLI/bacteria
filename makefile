make: build
	
build: run
	
run:
	open ./index.html

deploy:
	rsync -vrc * tyg@theyardgames.org:/httpdocs/game/bacteria --exclude-from rsync-exclude