run: node_modules
	@yarn start

prd:
	@git pull
	@yarn build

node_modules:
	@yarn

.PHONY: \
	run \
	prd
