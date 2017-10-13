# Run any binary easily on AWS Lambda

Although most of the examples are based on [AWS Lambda](https://aws.amazon.com/lambda/) this module can be used in normal Node.js applications.

The idea of this solution for AWS Lambda is explained at my article https://www.lambrospetrou.com/articles/aws-lambda-meets-racket/

This module allows you to start any executable as a subprocess (using ```child_process.spawn()```) and communicate with it over ```standard input and output```. It is really just a wrapper on **child_process** and **readline** to reduce the boilerplate needed in Lambdas.

I tested this module with [Racket](https://racket-lang.org/), [Go](https://golang.org/), [cat](https://ss64.com/bash/cat.html), and you can use it for **any** binary that runs on your system or in case of AWS Lambda any binary that runs on Amazon Linux.