using AutoMapper;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using System;

using FinishLineApi.Models;
using FinishLineApi.Services;
using FinishLineApi.Store.Contexts;

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

            services.AddLogging(logging =>
            {
                logging.AddConsole();
                logging.AddDebug();
            });

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
        }

        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app, IHostingEnvironment env, IServiceProvider host)
        {
            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
            }
            else
            {
                app.UseExceptionHandler();
                app.UseHsts();
            }

            app.UseMvc();

            if (env.IsDevelopment())
            {
                IFinishLineDBContext dbContext = host.GetRequiredService<IFinishLineDBContext>();
                dbContext.CreateSeedData();
            }
        }
    }
}
