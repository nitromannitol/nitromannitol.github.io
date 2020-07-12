## process all the aggregate files and compute median 
## and median prediction errors
using DelimitedFiles,HTTP

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


## get true data 
res = HTTP.get("https://covid.ourworldindata.org/data/ecdc/total_deaths.csv");
true_data = readdlm(res.body,',')
kuwait_ind = findall(true_data[1,:].=="Kuwait")[1]
true_data = [true_data[:,1] true_data[:,kuwait_ind]]
#build a dictionary from date to true deaths 
zz = Dict()
for i in 1:size(true_data,1)
	zz[true_data[i,1]]=true_data[i,2]
end



one_week_model_errors = []
for mm in models
	## determine 1 week normalized prediction error for each model 
	errors = [] 
	curr_data = readdlm(string(mm,"/aggregate.csv"),',')
	for i in 1:size(curr_data,1)
		row = curr_data[i,:]
		if(row[3] == "1 wk ahead cum death")
			pred = row[5]; 
			actual = zz[row[2]]
			println(mm, " ", (pred, actual))
			push!(errors, 100*abs(pred-actual)/actual)
		end
	end
	push!(one_week_model_errors, median(errors))
end

four_week_model_errors = []
for mm in models
	## determine 1 week normalized prediction error for each model 
	errors = [] 
	curr_data = readdlm(string(mm,"/aggregate.csv"),',')
	for i in 1:size(curr_data,1)
		row = curr_data[i,:]
		if(row[3] == "6 wk ahead cum death")
			pred = row[5]; 
			actual = zz[row[2]]
			println(mm, " ", (pred, actual))
			push!(errors, 100*abs(pred-actual)/actual)
		end
	end
	push!(six_week_model_errors, median(errors))
end














## at the very end write this
aggregate_data = [header_str; aggregate_data]
