#!/bin/bash

# converts spreadsheet data about student origins to a "year:students" style string
# writes a csv file containing the appropriate state id and the string

csvname="students.csv"

echo "\"ID\",\"students\"" > "${csvname}"

orleansmem=""


for j in `seq 0 34`; do
	pairs=(`cat students-by-state.csv | cut -f 1,$(($j+2)) -d ',' | sed "s/.*,$//g" | tr ',' ' '`)
	state=${pairs[1],,}
	pstr=`for k in \`seq 2 $((${#pairs[@]}-1))\`; do if [ $(($k/2*2)) -eq $k ]; then printf "%d:" ${pairs[$k]}; else printf "%03d," ${pairs[$k]};fi;done;printf "\n"`
	if [ ! "${state}" == "indian_territory" ]; then
		if [ "${state}" == "north" ]; then
			state="ak"
		fi
		if [ "${state}" == "south" ]; then
			state="hi"
		fi
		
		# move 6 students in the years 1805 to 1809 from Louisiana Territory to Orleans Territory
		# this actually copies all of them, but the territory ends before there are more
		if [ "${state}" == "la" ]; then
			ostr="\"ol_terr\",\"`echo ${pstr} | sed \"s/,$//\"`\"";
			echo "${ostr}" >> "${csvname}"
		fi
		
		nstr="\"${state}\",\"`echo $pstr | sed \"s/,$//\"`\"";
		rstr="\"${state}_republic\",\"`echo $pstr | sed \"s/,$//\"`\"";
		sstr="\"${state}_state\",\"`echo $pstr | sed \"s/,$//\"`\"";
		
		# because of the above move, don't write the la_terr entry at all
		if [ ! "${state}" == "la" ];then
			tstr="\"${state}_terr\",\"`echo $pstr | sed \"s/,$//\"`\"";
		fi
		
		echo "${nstr}" >> "${csvname}"
		echo "${rstr}" >> "${csvname}"
		echo "${sstr}" >> "${csvname}"
		echo "${tstr}" >> "${csvname}"
	else
		tstr="\"it_indianterr\",\"`echo $pstr | sed \"s/,$//\"`\"";
		echo "${tstr}" >> "${csvname}"
	fi
done
