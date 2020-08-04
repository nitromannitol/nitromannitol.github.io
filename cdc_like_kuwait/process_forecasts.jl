## process all the aggregate files and compute median 
## and median prediction errors
using DelimitedFiles,HTTP,Statistics

cd("/home/nitro/Desktop/COVID_Kuwait/Public_Site/nitromannitol.github.io/cdc_like_kuwait/forecasts")

## all folders in this directory hold an aggregate.csv whihc
## we can use to build the model_forecasts
models = readdir(".")
mm = models[1]
aggregate_data = readdlm(string(mm,"/aggregate.csv"),',')
header_str =["model" "forecast_date" "target" "target_week_end_date" "point" "quantile_0.05" "quantile_0.95"]


for mm in models[2:end]
	global aggregate_data = [aggregate_data; readdlm(string(mm,"/aggregate.csv"),',')]
end




forecast_dates = unique(aggregate_data[:,2])
targets = unique(aggregate_data[:,3])
ensemble_start = header_str


## generate the ensemble forecast
for forecast_date in forecast_dates
	for target in targets 
		forecasts = [] 
		aggregate_data[1,:]
		target_week_end_date = ""
		for i in 1:size(aggregate_data,1)
			row = aggregate_data[i,:]
			#println(row[2], " ", forecast_dates)
			if(row[2] == forecast_date && row[3] == target)
				if(row[5] != "")
					push!(forecasts, row[5])
				end
				target_week_end_date = row[4]
			end
		end
		if(length(forecasts) > 2) ## only compute ensemble of two forecasts
			#println(forecasts)
			global ensemble_start = [ensemble_start; "Ensemble" forecast_date target target_week_end_date median(forecasts) "" ""]
		end
	end
end

ensemble_model = ensemble_start[2:end,:]







## get true data 
res = HTTP.get("https://covid.ourworldindata.org/data/ecdc/total_deaths.csv");
true_data = readdlm(res.body,',')
kuwait_ind = findall(true_data[1,:].=="Kuwait")[1]
true_data = [true_data[:,1] true_data[:,kuwait_ind]]
#build a dictionary from date to true deaths 
true_death_dict = Dict()
for i in 1:size(true_data,1)
	true_death_dict[true_data[i,1]]=true_data[i,2]
end
writedlm("total_deaths.csv",true_data,',')


## model_arr is the aggregation 2D array
## target is * wk ahead cum death 
## only include if they have more than 2
function computeMedianError(true_death_dict, model_arr, target)	
	errors = [] 
	for i in 1:size(model_arr,1)
		row = model_arr[i,:]
		if(row[3] == target && haskey(true_death_dict, row[4]))
			pred = row[5]; 
			actual = true_death_dict[row[4]]
			println(row[2], " " , row[1], " ", (pred, actual))
			#push!(errors, 100*abs(pred-actual)/actual)
			push!(errors, 100*abs(pred-actual)/actual)
		end
	end
	if(length(errors) > 2) 
		return median(errors);
	else
		return NaN
	end
end


one_week_model_errors = -1*ones(length(models)+1)
one_week_model_errors[1] = computeMedianError(true_death_dict, ensemble_model, "1 wk ahead cum death");
for ii in 1:length(models)
	mm = models[ii]
	curr_data = readdlm(string(mm,"/aggregate.csv"),',')
	one_week_model_errors[ii+1] = computeMedianError(true_death_dict, curr_data, "1 wk ahead cum death");
end


three_week_model_errors = -1*ones(length(models)+1)
three_week_model_errors[1] = computeMedianError(true_death_dict, ensemble_model, "3 wk ahead cum death");
for ii in 1:length(models)
	mm = models[ii]
	curr_data = readdlm(string(mm,"/aggregate.csv"),',')
	three_week_model_errors[ii+1] = computeMedianError(true_death_dict, curr_data, "3 wk ahead cum death");
end




six_week_model_errors = -1*ones(length(models)+1)
six_week_model_errors[1] = computeMedianError(true_death_dict, ensemble_model, "6 wk ahead cum death");
for ii in 1:length(models)
	mm = models[ii]
	curr_data = readdlm(string(mm,"/aggregate.csv"),',')
	six_week_model_errors[ii+1] = computeMedianError(true_death_dict, curr_data, "6 wk ahead cum death");
end









## at the very end write this
aggregate_data = [ensemble_start; aggregate_data]
display(aggregate_data)
writedlm("/home/nitro/Desktop/COVID_Kuwait/Public_Site/nitromannitol.github.io/cdc_like_kuwait/model_forecasts.csv",aggregate_data, ',')



## display the median prediction error for each forecast
#arr = [["Ensemble"; models] one_week_model_errors three_week_model_errors six_week_model_errors]
#arr = ["Model" "One week error" "Three week error" "Six week error"; arr]
#display(arr)
println(arr[2:end,1])
println(round.(arr[2:end,2],digits=1), ",", 
	round.(arr[2:end,3],digits=1), 
	",",
round.(arr[2:end,4],digits=1))

