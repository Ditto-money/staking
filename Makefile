run: node_modules
	@yarn start

prd:
	@yarn build

node_modules:
	@yarn

.PHONY: \
	run \
	prd
