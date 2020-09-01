## process all the aggregate files and compute median 
## and median prediction errors
using DelimitedFiles,HTTP,Statistics

cd("/home/nitro/Desktop/Public_Site/nitromannitol.github.io/aggregate/forecasts")

## all folders in this directory hold an aggregate.csv whihc
## we can use to build the model_forecasts
models = readdir(".")
header_str =["model" "forecast_date" "target" "target_week_end_date" "point" "quantile_0.05" "quantile_0.95"]
data = [] 


for mm in models[1:end]
	if(isfile(string(mm,"/aggregate_cases.csv")))
		push!(data, readdlm(string(mm,"/aggregate_cases.csv"),','))
	end
end
global aggregate_data = data[1]
for i in 2:length(data)
	global aggregate_data = [aggregate_data; data[i]]
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
res = HTTP.get("https://covid.ourworldindata.org/data/ecdc/total_cases.csv");
true_data = readdlm(res.body,',')
kuwait_ind = findall(true_data[1,:].=="Kuwait")[1]
true_data = [true_data[:,1] true_data[:,kuwait_ind]]
#build a dictionary from date to true deaths 
true_death_dict = Dict()
for i in 1:size(true_data,1)
	true_death_dict[true_data[i,1]]=true_data[i,2]
end
writedlm("/home/nitro/Desktop/Public_Site/nitromannitol.github.io/aggregate/total_cases.csv",true_data,',')

aggregate_data = [ensemble_start; aggregate_data]

writedlm("/home/nitro/Desktop/Public_Site/nitromannitol.github.io/aggregate/model_forecasts_cases.csv",aggregate_data, ',')


