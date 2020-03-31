using PyPlot

data = readcsv("data.csv")
dates = data[2:end,1];
count = Int.(data[2:end,2])


#first flatten the data
counts = []
i = 1;
while(i < length(count))
	if(dates[i] != dates[i+1])
		push!(counts, count[i])
	end
	i+=1;
end
push!(counts,count[i])
dates = unique(dates)
counts = counts


dates2 = [];
#modify the dates 
for DD in dates
	day, mon, year = split(DD, "-");

	year = string("20",year)

	if(length(day)==1)
		day = string("0", day);
	end
	if(mon == "Feb")
		mon = "02"
	end
	if(mon == "Mar")
		mon = "03"
	end
	push!(dates2, string(year, "-", mon, "-", day));
end


#add 0 more days to the dates
num_iters = 0;
curr_date = dates2[end];
for k in 1:num_iters
	year, mon, day = split(curr_date, "-");
	year = parse(year); mon = parse(mon); day = parse(day);
	if(day == 31 && mon == 3)
		day = 1
		mon = 4
	else
		day = day+1;
	end
	mon = string(mon);
	year = string(year);
	day = string(day);
	if(length(day)==1)
		day = string("0", day);
	end
	if(length(mon)==1)
		mon = string("0", mon);
	end
	curr_date = string(year, "-", mon, "-", day);
	push!(dates2, curr_date);
	push!(counts, counts[end])
end


dates=copy(dates2);



#save data
data_out = Array{Any,2}(length(dates)+1,2)
data_out[1,1] = "date";
data_out[1,2] = "total_count";

data_out[2:length(dates)+1,1] = dates;
data_out[2:end,2] = counts

 writecsv("data_fit.csv",data_out)
Z = [];
i = 1; 
while(true)
	push!(Z, counts[i+3]-counts[i]; )
	i = i +3; 
	if(i > length(counts))
		break;
	end
end
