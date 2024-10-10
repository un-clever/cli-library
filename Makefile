
test:
	@echo SKIPPING MARKDOWN TESTS FOR NOW: redo after major refactor
	# deno test --allow-read --doc
	deno test --allow-read

testw:
	deno test --watch --allow-read