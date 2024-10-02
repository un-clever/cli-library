TEST_ARGS=--doc --allow-read *.ts ./src/**/*.ts

test:
	deno test ${TEST_ARGS}

testw:
	deno test --watch ${TEST_ARGS}