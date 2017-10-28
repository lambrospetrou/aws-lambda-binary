#!/bin/sh

#for i in $(ls -d -- */); do
for i in */; do 
	cd "$i"
	make bundle
	cd ../ 
done