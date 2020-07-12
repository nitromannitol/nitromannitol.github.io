using DelimitedFiles,Dates



## only look at the monday updates
file_names = [ "2020-05-31.csv",
 "2020-06-14.csv",
 "2020-06-28.csv",
 "2020-07-05.csv"
]


function convertIHMEtoISO(input_date)
	m,d,y = split(input_date,"/")
	d = lpad(d, 2, "0")
	m = lpad(m, 2, "0")
	return string(y,"-",m,"-",d)
end


#new_data = []
#push the header string
header_str = "model,forecast_date,target,target_week_end_date,point,quantile_0.05,quantile_0.95";


#push!(new_data, "model,forecast_date,target,target_week_end_date,point,quantile_0.025,quantile_0.975")
new_data = Array{Any,2}(undef, length(file_names)*6,length(split(header_str,',')))

## the first file is processed differently 

curr_row = 1; 
file_name = file_names[1]
data = readdlm(file_name, ',')
#extract jus the deaths
data = data[data[:,4].==24,:]
b_ind = 7
p_ind = 5
w_ind = 6
arr = split(file_name,".")
f_date_str = arr[1]; 
forecast_date = DateTime(arr[1]); 
global target_date = forecast_date + Dates.Day(7)
global t_date_str = split(string(target_date),"T")[1]
target_str = " wk ahead cum death"
curr_week = 1;

for i in 1:size(data,1)
	row = data[i,:]
	curr_date = convertIHMEtoISO(row[1]); 
	if(curr_date==t_date_str)
		new_data[curr_row,1] = "IHME"
		new_data[curr_row,2] = f_date_str; #forecast date
		new_data[curr_row,3] = string(curr_week, target_str); 
		new_data[curr_row,4] = t_date_str;
		new_data[curr_row,5] = round(Int,row[p_ind])
		new_data[curr_row,6] = round(Int,row[b_ind]);
		new_data[curr_row,7] = round(Int,row[w_ind]);
		global target_date = target_date + Dates.Day(7)
		global t_date_str = split(string(target_date),"T")[1]
		global curr_row+=1; 
		global curr_week+=1;
	end
	if(curr_week == 7) ## only keep track of 6 week forecasts for now
		break;
	end
end




for file_name in file_names[2:length(file_names)]
	println(file_name)
	data = readdlm(file_name, ',')
	arr = split(file_name,".")
	f_date_str = arr[1]; 
	forecast_date = DateTime(arr[1]); 
	b_ind = findall(data[1,:].=="lower")[1]
	p_ind = findall(data[1,:].=="mean")[1]
	w_ind = findall(data[1,:].=="upper")[1]
	date_ind = findall(data[1,:].=="date_reported")[1]
	target_date = forecast_date + Dates.Day(7)
	t_date_str = split(string(target_date),"T")[1]
	target_str = " wk ahead cum death"
	curr_week = 1
	## extract just the deaths
	data = data[data[:,1].==24,:]
	## extract just the reference scanrio ID
	data = data[data[:,5].==1,:]


	for i in 1:size(data,1)
		row = data[i,:]
		curr_date = row[date_ind];
		if(occursin("/",curr_date))
			curr_date = convertIHMEtoISO(curr_date); 
		end
		if(curr_date == t_date_str)
			new_data[curr_row,1] = "IHME"
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
	println(new_data[curr_row-1,:])

end

writedlm("aggregate.csv",new_data,',')


