#lang racket/base

;; This is the actual logic of our code!
(define (execute-logic data)
  (display (format "data: ~a~%" data)))

;; The following code waits for one line of input and then dispatches it to the `execute-logic` function.
;; This way we can have full control over what we can do and there can be an arbitrarily complex protocol
;; between the caller and this application over **stdio**.
(define (loopInput)
  (execute-logic (read-line))
  (loopInput))
(loopInput)
