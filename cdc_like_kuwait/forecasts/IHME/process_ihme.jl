using DelimitedFiles,Dates,HTTP

#start_date = DateTime(2020,5,31)
#end_date = Dates.today()


file_dir = "/home/nitro/Desktop/COVID_Kuwait/Public_Site/nitromannitol.github.io/cdc_like_kuwait/forecasts/IHME/"

f_len = length(readdir("."))

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
new_data = Array{Any,2}(undef, f_len*6,length(split(header_str,',')))

daily_cases = []
#new_data_cases = Array{Any,2}(undef, f_len*6,length(split(header_str,',')))




## the first file is processed differently 

curr_row = 1; 
file_name = file_names[1]
data = readdlm(string(file_dir, file_name), ',')
#extract jus the deaths
data_cases = data[data[:,4].==21,:]
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

	row_cases = data_cases[i,:]
	row = data[i,:]
	curr_date = convertIHMEtoISO(row[1]); 
	push!(daily_cases, [f_date_str, curr_date,round(Int,row_cases[p_ind]), round(Int,row_cases[b_ind]),round(Int,row_cases[w_ind])])




	if(curr_date==t_date_str)
		new_data[curr_row,1] = "IHME"
		new_data[curr_row,2] = f_date_str; #forecast date
		new_data[curr_row,3] = string(curr_week, target_str); 
		new_data[curr_row,4] = t_date_str;
		new_data[curr_row,5] = round(Int,row[p_ind])
		new_data[curr_row,6] = round(Int,row[b_ind]);
		new_data[curr_row,7] = round(Int,row[w_ind]);

		#new_data_cases[curr_row,1] = "IHME"
		#new_data_cases[curr_row,2] = f_date_str; #forecast date
		#new_data_cases[curr_row,3] = string(curr_week, " wk ahead cum cases"); 
		#new_data_cases[curr_row,4] = t_date_str;
		#new_data_cases[curr_row,5] = round(Int,row[p_ind])
		#new_data_cases[curr_row,6] = round(Int,row[b_ind]);
		#new_data_cases[curr_row,7] = round(Int,row[w_ind]);


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
	data = readdlm(string(file_dir, file_name), ',')
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
	## extract just the deaths and cases
	# and reference scenario
	data_cases = data[data[:,1].==21,:]
	data_cases = data_cases[data_cases[:,5].==1,:]


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


			#new_data_cases[curr_row,1] = "IHME"
			#new_data_cases[curr_row,2] = f_date_str; #forecast date
			#new_data_cases[curr_row,3] = string(curr_week, " wk ahead cum cases"); 
			#new_data_cases[curr_row,4] = t_date_str;
			#new_data_cases[curr_row,5] = round(Int,row[p_ind])
			#new_data_cases[curr_row,6] = round(Int,row[b_ind]);
			#new_data_cases[curr_row,7] = round(Int,row[w_ind]);





			target_date = target_date + Dates.Day(7)
			t_date_str = split(string(target_date),"T")[1]
			global curr_row+=1; 
			curr_week+=1;
		end
		if(curr_week == 7) ## only keep track of 6 week forecasts for now
			break;
		end
	end


	for i in 1:size(data_cases,1)
		row_cases = data_cases[i,:]
		curr_date = row_cases[date_ind];
		if(occursin("/",curr_date))
			curr_date = convertIHMEtoISO(curr_date); 
		end
		push!(daily_cases, [f_date_str, curr_date,round(Int,row_cases[p_ind]), round(Int,row_cases[b_ind]),round(Int,row_cases[w_ind])])
	end

	#println(new_data[curr_row-1,:])

end



bad_ind = copy(curr_row)
## now append the rest of the files in the directory
for f in readdir(file_dir)
	arr = split(f,"_")
	#println(arr)
	if(length(arr) == 3)
		y = arr[1]
		m = arr[2]
		d = arr[3]
		date = DateTime(parse(Int,y),parse(Int,m),parse(Int,d))

		#round to nearest Sunday
		curr_date = round(date,Dates.Week(1)) - Dates.Day(1)
		#println(curr_date)
		forecast_date = curr_date

		f_date_str = split(string(curr_date),"T")[1]



		println(date, " rounding to ", curr_date)



		file_name = "$file_dir/$f/Reference_hospitalization_all_locs.csv"
		F = readdlm(file_name,',')

		loc_ind = findall(F[1,:].=="location_name")[1]
		p_ind = findall(F[1,:].=="totdea_mean_smoothed")[1]
		w_ind = findall(F[1,:].=="totdea_lower_smoothed")[1]
		b_ind = findall(F[1,:].=="totdea_upper_smoothed")[1]


		p2_ind = findall(F[1,:].=="est_infections_mean")[1]
		w2_ind = findall(F[1,:].=="est_infections_lower")[1]
		b2_ind = findall(F[1,:].=="est_infections_upper")[1]

		date_ind = findall(F[1,:].=="date")[1]



		data = F[F[:,loc_ind].=="Kuwait",:]
		target_date = forecast_date + Dates.Day(7)
		t_date_str = split(string(target_date),"T")[1]
		curr_week = 1




		for i in 1:size(data,1)
			row = data[i,:]
			curr_date = row[date_ind];
			if(occursin("/",curr_date))
				curr_date = convertIHMEtoISO(curr_date); 
			end
			push!(daily_cases, [f_date_str, curr_date, round(Int,row[p2_ind]), round(Int,row[b2_ind]),round(Int,row[w2_ind])])
			if(curr_date == t_date_str)
				new_data[curr_row,1] = "IHME"
				new_data[curr_row,2] = f_date_str; #forecast date
				new_data[curr_row,3] = string(curr_week, target_str); 
				new_data[curr_row,4] = t_date_str;
				new_data[curr_row,5] = round(Int,row[p_ind])
				new_data[curr_row,6] = round(Int,row[b_ind]);
				new_data[curr_row,7] = round(Int,row[w_ind]);

				#new_data_cases[curr_row,1] = "IHME"
				#new_data_cases[curr_row,2] = f_date_str; #forecast date
				#new_data_cases[curr_row,3] = string(curr_week, " wk ahead cum cases"); 
				#new_data_cases[curr_row,4] = t_date_str;
				#new_data_cases[curr_row,5] = round(Int,row[p2_ind])
				#new_data_cases[curr_row,6] = round(Int,row[b2_ind]);
				#new_data_cases[curr_row,7] = round(Int,row[w2_ind]);



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
new_data = new_data[1:curr_row-1,:]

## convert each forecast to cumulative
## using dictionary of cumulative cases 

## get true data 
res = HTTP.get("https://covid.ourworldindata.org/data/ecdc/total_cases.csv");
true_data = readdlm(res.body,',')
kuwait_ind = findall(true_data[1,:].=="Kuwait")[1]
true_data = [true_data[:,1] true_data[:,kuwait_ind]]
#build a dictionary from date to true deaths 
true_case_dict = Dict()
for i in 2:size(true_data,1)
	true_case_dict[true_data[i,1]]=true_data[i,2]
end



function getDateTime(str)
	y,m,d = split(str,"-")
	y = parse(Int,y); m = parse(Int,m); d = parse(Int,d)
	return DateTime(y,m,d)

end








##convert each week to cumulative using the raw data
forecast_dates = unique(new_data[:,2])
global curr_row = 1
new_data_cases = Array{Any,2}(undef, f_len*6,length(split(header_str,',')))


for i in 1:length(forecast_dates)
	curr_date = forecast_dates[i]
	curr_week = 1
	target_date = getDateTime(curr_date) + Dates.Day(7)
	t_date_str = split(string(target_date),"T")[1]


	ff = forecast_dates[i]


	dc = [] 

	for dd in daily_cases
		if(dd[1] == ff && getDateTime(dd[2]) >= getDateTime(ff))
			push!(dc, dd)
		end
	end

	start_cases = true_case_dict[dc[1][2]]
	 w = start_cases
	 p = start_cases
	 b = start_cases
	dc_ = [] 
	for dd in dc
		f_date, date, p_,w_,b_ = dd
		if(b_ == 0) 
			b_ = p_
		end
		 p = p + p_
		 w = w + w_
		 b = b + b_
		push!(dc_, [f_date, date, p, w,b])
	end


	for dd in dc_
		f_date, date, p,w,b = dd
		d1 = getDateTime(f_date)
		d2 = getDateTime(date)

		if(date == t_date_str)
			new_data_cases[curr_row,1] = "IHME"
			new_data_cases[curr_row,2] = f_date; #forecast date
			new_data_cases[curr_row,3] = string(curr_week, " wk ahead cum cases"); 
			new_data_cases[curr_row,4] = t_date_str;
			new_data_cases[curr_row,5] = p
			new_data_cases[curr_row,6] = b
			new_data_cases[curr_row,7] = w

			 target_date = target_date + Dates.Day(7)
			 t_date_str = split(string(target_date),"T")[1]
			global  curr_row+=1; 
			 curr_week+=1;

		end
		if(curr_week == 7) 
			break;
		end
	end





end












new_data_cases = new_data_cases[1:curr_row-1,:]















writedlm("$file_dir/aggregate.csv",new_data,',')


writedlm("$file_dir/aggregate_cases.csv",new_data_cases,',')
