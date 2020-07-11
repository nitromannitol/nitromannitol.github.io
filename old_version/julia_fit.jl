using PyPlot

data = readcsv("data.csv")
dates = data[2:end,1];
count = Int.(data[2:end,2])
total_ICU = Int.(data[2:end,3]);
total_recovered = Int.(data[2:end,4]);


#first flatten the data
counts = []
total_ICU_vec = []; 
total_recovered_vec = []; 

i = 1;
while(i < length(count))
	if(dates[i] != dates[i+1])
		push!(counts, count[i])
		push!(total_ICU_vec, total_ICU[i]);
		push!(total_recovered_vec, total_recovered[i])
	end
	i+=1;
end
push!(total_ICU_vec, total_ICU[i]);
push!(counts,count[i])
push!(total_recovered_vec, total_recovered[i]);
dates = unique(dates)
counts = counts
total_ICU = total_ICU_vec; 
total_recovered = total_recovered_vec; 


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
	if(mon == "Apr")
		mon = "04"
	end
	if(mon == "May")
		mon = "05"
	end
	if(mon == "Jun")
		mon = "06"
	end
	push!(dates2, string(year, "-", mon, "-", day));
end


#add k more days to the dates
num_iters = 14;
curr_date = dates2[end];
for k in 1:num_iters
	year, mon, day = split(curr_date, "-");
	year = parse(year); mon = parse(mon); day = parse(day);
	if(day == 31 && mon == 3)
		day = 1
		mon = 4
	elseif(day == 30 && mon == 4)
		day = 1
		mon = 5
	elseif(day == 31 && min == 5)
		day = 1;
		mon = 6;
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
	push!(total_recovered, total_recovered[end])
	push!(total_ICU, total_ICU[end])
end


dates=copy(dates2);

#save data
data_out = Array{Any,2}(length(dates)+1,4)
data_out[1,1] = "date";
data_out[1,2] = "total_count";
data_out[1,3] = "total_ICU";
data_out[1,4] = "total_recovered";


data_out[2:length(dates)+1,1] = dates;
data_out[2:end,2] = counts
data_out[2:end,3] = total_recovered
data_out[2:end,4] = total_ICU


 writecsv("data_fit.csv",data_out)




Z = [];
i = 1; 
while(true)
	push!(Z, counts[i+2]-counts[i]; )
	i = i +3; 
	if(i > length(counts))
		break;
	end
end

Z = []
i = 1; 
CC = [count[1]; diff(count)];
while(true)
	if(i + 7 > length(CC)) break; end;
	#push!(Z, mean(CC[i:i+7]))
	push!(Z, sum(CC[i:i+7]))
	i = i + 8;
	if(i > length(CC))
		break;
	end
end
bar(1:length(Z), Z)
suptitle("Total new cases per week")
title("Kuwait")
xlabel("Weeks since Feb 25th")
ylabel("Confirmed new cases")

CC = counts[1:end-num_iters]
println(length(CC)-findn(CC.>=CC[end]/2)[1])

S01 = 1335712; 
S02 = 3084398; 
println(1e3*CC[end]/(S01+S02))

## 7 day moving average
Z = []
CC = [count[1]; diff(count)];
i = 7;
while(true)
	if(i > length(CC)) break; end;
	#push!(Z, mean(CC[i:i+7]))
	push!(Z, mean(CC[i-7+1:i]))
	i = i + 1;
	if(i > length(CC))
		break;
	end
end
clf()
bar(1:length(Z), Z)
suptitle("Seven day moving average")
title("Confirmed new cases of COVID-19 in Kuwait")
xlabel("Days since March 2nd")


