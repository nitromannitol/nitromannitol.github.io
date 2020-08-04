using DelimitedFiles,Dates


## only look at monday updates
start_date = DateTime(2020,4,17)
end_date = Dates.today()
file_dir = "/home/nitro/Desktop/COVID_Kuwait/Public_Site/nitromannitol.github.io/cdc_like_kuwait/forecasts/LANL"


curr_date = start_date;
Dates.dayofweek(end_date)

global num_mondays = 0
## count the number of mondays
while(curr_date <= end_date)
	if(Dates.dayofweek(curr_date) == 7) # if we are on a sunday
		m = lpad(Dates.month(curr_date),2,"0")
		d = lpad(Dates.day(curr_date),2,"0")
		y = Dates.year(curr_date)
		file_name = string("$file_dir/$y-$m-$d","_deaths_quantiles_global_website.csv")
		if(isfile(file_name))
			global num_mondays = num_mondays + 1
		end
	end
	global curr_date = curr_date + Dates.Day(1)
end
curr_date = start_date
num_mondays+=1 #the off by one



#new_data = []
#push the header string
header_str = "model,forecast_date,target,target_week_end_date,point,quantile_0.05,quantile_0.95";


#push!(new_data, "model,forecast_date,target,target_week_end_date,point,quantile_0.025,quantile_0.975")
new_data = Array{Any,2}(undef, num_mondays*6,length(split(header_str,',')))




#push!(new_data, "model,forecast_date,target,target_week_end_date,point,quantile_0.025,quantile_0.975")
new_data_cases = Array{Any,2}(undef, num_mondays*6,length(split(header_str,',')))



global curr_row1 = 1
global curr_row2 = 1
ss = 0
while(curr_date <= end_date)
	if(Dates.dayofweek(curr_date) == 7) # if we are on a sunday
		#exception
		if(curr_date == DateTime(2020,6,14))
			curr_date = DateTime(2020,6,13)
			m = lpad(Dates.month(curr_date),2,"0")
			d = lpad(Dates.day(curr_date),2,"0")
			y = Dates.year(curr_date)
						curr_date = DateTime(2020,6,14)

		else	
			#println(curr_date)
			m = lpad(Dates.month(curr_date),2,"0")
			d = lpad(Dates.day(curr_date),2,"0")
			y = Dates.year(curr_date)
		end
		f_date_str = "$y-$m-$d"
		file_name = string("$file_dir/$y-$m-$d","_deaths_quantiles_global_website.csv")


		forecast_date = curr_date
		if(isfile(file_name)) 
			data = readdlm(file_name, ',')
			f_d = f_date_str
			if(f_d == "2020-06-13") ## LANL accidently released forecasts a day early
				f_d = "2020-06-14"
			end
			println(f_d)
			forecast_date = DateTime(f_d); 
			b_ind = findall(data[1,:].=="q.05")[1]
			p_ind = findall(data[1,:].=="q.50")[1]
			w_ind = findall(data[1,:].=="q.95")[1]
			date_ind = findall(data[1,:].=="dates")[1]
			data = data[data[:,2].=="kuwait",:]


			target_date = forecast_date + Dates.Day(7)
			t_date_str = split(string(target_date),"T")[1]
			target_str = " wk ahead cum death"
			curr_week = 1

			for i in 1:size(data,1)
				row = data[i,:]
				if(row[date_ind] == t_date_str)
					new_data[curr_row1,1] = "LANL"
					new_data[curr_row1,2] = f_d; #forecast date
					new_data[curr_row1,3] = string(curr_week, target_str); 
					new_data[curr_row1,4] = t_date_str;
					new_data[curr_row1,5] = round(Int,row[p_ind])
					new_data[curr_row1,6] = round(Int,row[b_ind]);
					new_data[curr_row1,7] = round(Int,row[w_ind]);
					target_date = target_date + Dates.Day(7)
					t_date_str = split(string(target_date),"T")[1]
					global curr_row1+=1; 
					curr_week+=1;
				end
			end
		end

		file_name = string("$file_dir/$y-$m-$d","_confirmed_quantiles_global_website.csv")
		forecast_date = curr_date
		if(isfile(file_name)) 
			data = readdlm(file_name, ',')
			f_d = f_date_str
			if(f_d == "2020-06-13") ## LANL accidently released forecasts a day early
				f_d = "2020-06-14"
			end
			println(f_d)
			forecast_date = DateTime(f_d); 
			b_ind = findall(data[1,:].=="q.05")[1]
			p_ind = findall(data[1,:].=="q.50")[1]
			w_ind = findall(data[1,:].=="q.95")[1]
			date_ind = findall(data[1,:].=="dates")[1]
			data = data[data[:,2].=="kuwait",:]


			target_date = forecast_date + Dates.Day(7)
			t_date_str = split(string(target_date),"T")[1]
			target_str = " wk ahead cum cases"
			curr_week = 1

			for i in 1:size(data,1)
				row = data[i,:]
				if(row[date_ind] == t_date_str)
					new_data_cases[curr_row2,1] = "LANL"
					new_data_cases[curr_row2,2] = f_d; #forecast date
					new_data_cases[curr_row2,3] = string(curr_week, target_str); 
					new_data_cases[curr_row2,4] = t_date_str;
					new_data_cases[curr_row2,5] = round(Int,row[p_ind])
					new_data_cases[curr_row2,6] = round(Int,row[b_ind]);
					new_data_cases[curr_row2,7] = round(Int,row[w_ind]);
					target_date = target_date + Dates.Day(7)
					t_date_str = split(string(target_date),"T")[1]
					global curr_row2+=1; 
					curr_week+=1;
				end
			end
		end



	end
	global curr_date = curr_date + Dates.Day(1)
	#println(curr_date)
end

new_data = new_data[1:curr_row1-1,:]
new_data_cases = new_data_cases[1:curr_row2-1,:]


writedlm("aggregate.csv",new_data,',')
writedlm("aggregate_cases.csv",new_data_cases,',')

