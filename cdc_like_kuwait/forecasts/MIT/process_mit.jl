using DelimitedFiles,Dates


## only look at monday updates
start_date = DateTime(2020,4,17)
end_date = DateTime(2020,7,27)
file_dir = "/home/nitro/Desktop/COVID_Kuwait/Public_Site/nitromannitol.github.io/cdc_like_kuwait/forecasts/MIT/website/data/predicted/"

curr_date = start_date;
Dates.dayofweek(end_date)

global num_mondays = 0
## count the number of mondays
while(curr_date <= end_date)
	if(Dates.dayofweek(curr_date) == 7) # if we are on a sunday
		m = lpad(Dates.month(curr_date),2,"0")
		d = lpad(Dates.day(curr_date),2,"0")
		y = Dates.year(curr_date)
		if(curr_date < DateTime(2020,7,4))
			file_name = string(file_dir, "Global_$y$m$d.csv")
		else
			file_name = string(file_dir, "Global_V2_$y$m$d.csv")
		end
		if(isfile(file_name))
			global num_mondays = num_mondays + 1
		end
	end
	global curr_date = curr_date + Dates.Day(1)
end
curr_date = start_date



#new_data = []
#push the header string
header_str = "model,forecast_date,target,target_week_end_date,point,quantile_0.05,quantile_0.95";


#push!(new_data, "model,forecast_date,target,target_week_end_date,point,quantile_0.025,quantile_0.975")
new_data = Array{Any,2}(undef, num_mondays*6,length(split(header_str,',')))

curr_row = 1; 
ss = 0
while(curr_date <= end_date)
	if(Dates.dayofweek(curr_date) == 7) # if we are on a sunday
		m = lpad(Dates.month(curr_date),2,"0")
		d = lpad(Dates.day(curr_date),2,"0")
		y = Dates.year(curr_date)
		f_date_str = "$y-$m-$d"

		if(curr_date < DateTime(2020,7,4))
			file_name = string(file_dir, "Global_$y$m$d.csv")
		else
			file_name = string(file_dir, "Global_V2_$y$m$d.csv")
		end
		if(isfile(file_name)) 
			#global ss+=1

			#println(curr_date)
			data = readdlm(file_name, ',')

			kuwait_data = data[data[:,2].=="Kuwait",:]
			p_ind = findall(data[1,:].=="Total Detected Deaths")[1]
			date_ind = findall(data[1,:].=="Day")[1]

			forecast_date = curr_date


			target_date = forecast_date + Dates.Day(7)
			t_date_str = split(string(target_date),"T")[1]
			target_str = " wk ahead cum death"
			curr_week = 1
			for i in 1:size(kuwait_data,1)
				row = kuwait_data[i,:]
				if(row[date_ind] == t_date_str)
					new_data[curr_row,1] = "MIT"
					new_data[curr_row,2] = f_date_str; #forecast date
					new_data[curr_row,3] = string(curr_week, target_str); 
					new_data[curr_row,4] = t_date_str;
					new_data[curr_row,5] = round(Int,row[p_ind])
					new_data[curr_row,6] = round(Int,row[p_ind])
					new_data[curr_row,7] = round(Int,row[p_ind])
					target_date = target_date + Dates.Day(7)
					t_date_str = split(string(target_date),"T")[1]
					global curr_row+=1; 
					curr_week+=1;
				end
				if(curr_week == 7) ## only keep track of 6 week forecasts for now
					break;
				end
			end
		end
	end
	global curr_date = curr_date + Dates.Day(1)
	#println(curr_date)
end

new_data = new_data[1:curr_row-1,:]

writedlm("aggregate.csv",new_data,',')


