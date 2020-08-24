data = readcsv("true_deaths.csv")

function processDate(str)
	mm,y = split(str, ",");
	m,d = split(mm, " ");
	y = Int(parse(y));
	d = Int(parse(d));
	if(m == "Dec")
		m = 12
	elseif(m == "Jan")
		m = 01
	elseif(m == "Feb")
		m = 02
	elseif(m == "Mar")
		m = 03
	elseif(m == "Apr")
		m = 04
	elseif(m == "May")
		m = 05;
	end
	if(length(string(d)) == 1)
		d = string("0",d)
	end
	return string(y,"-",m,"-",d)
end


date_vec = []
death_vec = []
for i in 1:size(data,1)
	zz  = data[i,4]; if(length(zz) == 0) continue; end
	println(typeof(zz), " ", zz, " ", i)
	if(typeof(zz) == SubString{String})
		curr_death = Int(parse(data[i,4]));
	else
		curr_death = Int(data[i,4])
	end
	if(curr_death >= 1)
		push!(death_vec, curr_death)
		#push!(date_vec, DateTime(processDate(data[i,3]), "m-d-y"))
		push!(date_vec, processDate(data[i,3]))
	end
end	
Header = ["date" "confirmed deaths"]
Data = [Header; date_vec  death_vec]

writecsv("true_deaths_processed.csv", Data)




