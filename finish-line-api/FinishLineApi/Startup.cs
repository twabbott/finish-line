using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.HttpsPolicy;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

using AutoMapper;

using FinishLineApi;
using FinishLineApi.Models;
using FinishLineApi.Services.Interfaces;
using FinishLineApi.Services.Implementations;

namespace FinishLineApi
{
    public class Startup
    {
        public Startup(IConfiguration configuration)
        {
            Configuration = configuration;
        }

        public IConfiguration Configuration { get; }

        // This method gets called by the runtime. Use this method to add services to the container.
        public void ConfigureServices(IServiceCollection services)
        {
            services
                .AddMvc()
                .SetCompatibilityVersion(CompatibilityVersion.Version_2_2);

            // Auto Mapper Configurations
            var mappingConfig = new MapperConfiguration(mc =>
            {
                mc.AddProfile(new AutoMapperProfile());
            });

            IMapper mapper = mappingConfig.CreateMapper();
            services.AddSingleton(mapper);

            // SQL Server configuration.  We're using SQL Server localdb
            var connection = @"Server=(localdb)\mssqllocaldb;Database=FinishLine;Trusted_Connection=True;ConnectRetryCount=0";
            services.AddDbContext<IFinishLineDBContext, FinishLineDBContext>(options => options.UseSqlServer(connection));

            // Add all custom DI mappings for your services/etc. here.  For more info
            // on lifetime, see this article: https://docs.microsoft.com/en-us/aspnet/core/fundamentals/dependency-injection?view=aspnetcore-2.1#service-lifetimes
            services
                .AddScoped<ILogEntriesService, LogEntriesService>(); // Data services should have a scoped lifetime, not transient.
                // .AddTransient<IFilterService, FilterService>(); // Non-data services can be transient or singleton.
        }

        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app, IHostingEnvironment env, ILoggingBuilder loggerBuilder, IServiceProvider host, IMapper mapper)
        {
            loggerBuilder.AddConsole();

            // IHostingEnvironment gets injected for us.  It contains all kinds of info about the
            // environment that our app is running under.  The IsDevelopment() method checks for a
            // system enviornment variable called ASPNETCORE_ENVIRONMENT, which can have three
            // values: Development, Staging, or Production.  You can set this var in Project
            // Properties, on the debug tab (it should already be set for you).
            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
            }
            else
            {
                // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
                app.UseExceptionHandler();
                app.UseHsts();
            }

            app.UseHttpsRedirection();

            app.UseMvc();
        }
    }
}
