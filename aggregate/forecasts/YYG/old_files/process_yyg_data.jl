using DelimitedFiles,Dates



## only look at the monday updates
file_names = [ "2020-05-31.csv",
 "2020-06-07.csv",
 "2020-06-14.csv",
 "2020-06-21.csv",
 "2020-06-28.csv",
 "2020-07-05.csv",
 "2020-07-19.csv"
]



#new_data = []
#push the header string
header_str = "model,forecast_date,target,target_week_end_date,point,quantile_0.05,quantile_0.95";


#push!(new_data, "model,forecast_date,target,target_week_end_date,point,quantile_0.025,quantile_0.975")
new_data = Array{Any,2}(undef, length(file_names)*6,length(split(header_str,',')))


curr_row = 1; 

for file_name in file_names
	data = readdlm(file_name, ',')
	arr = split(file_name,".")
	f_date_str = arr[1]; 
	forecast_date = DateTime(arr[1]); 
	b_ind = findall(data[1,:].=="predicted_total_deaths_lower")[1]
	p_ind = findall(data[1,:].=="predicted_total_deaths_mean")[1]
	w_ind = findall(data[1,:].=="predicted_total_deaths_upper")[1]
	date_ind = findall(data[1,:].=="date")[1]

	target_date = forecast_date + Dates.Day(7)
	t_date_str = split(string(target_date),"T")[1]
	target_str = " wk ahead cum death"
	curr_week = 1

	for i in 1:size(data,1)
		row = data[i,:]
		if(row[date_ind] == t_date_str)
			new_data[curr_row,1] = "YYG"
			new_data[curr_row,2] = f_date_str; #forecast date
			new_data[curr_row,3] = string(curr_week, target_str); 
			new_data[curr_row,4] = t_date_str;
			new_data[curr_row,5] = round(Int,row[p_ind])
			new_data[curr_row,6] = round(Int,row[b_ind]);
			new_data[curr_row,7] = round(Int,row[w_ind]);
			target_date = target_date + Dates.Day(7)
			t_date_str = split(string(target_date),"T")[1]
			global curr_row+=1; 
			curr_week+=1;
		end
		if(curr_week == 7) ## only keep track of 6 week forecasts for now
			break;
		end
	end
	#println(new_data[curr_row-1,:])

end

writedlm("aggeregate.csv",new_data,',')

