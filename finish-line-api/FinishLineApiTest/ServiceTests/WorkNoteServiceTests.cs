using FinishLineApi;
using FinishLineApi.Services;
using FinishLineApi.Store.Contexts;
using FinishLineApi.Store.Entities;
using Moq;
using System;
using System.Linq;
using System.Collections.Generic;
using Xunit;
using FluentAssertions;
using FinishLineApi.Dto;
using Microsoft.Extensions.Logging;
using Microsoft.AspNetCore.Hosting;
using FinishLineApi.DTO.Validators;
using FinishLineApi.Store.Repositories;
using System.Threading.Tasks;

namespace ServiceTests
{
    public class WorkNoteServiceTests
    {
        Mock<ILogger<FinishLineDBContext>> _mockLogger = new Mock<ILogger<FinishLineDBContext>>();
        Mock<IHostingEnvironment> _mockHostingEnvironment = new Mock<IHostingEnvironment>();

        int _nextId = 1002;
        List<WorkNote> _testData = new List<WorkNote>
        {
            new WorkNote()
            {
                Id = 1000,
                Title = "I did this",
                Content = "No issues found",
                CreatedDate = new DateTime(2019, 07, 15, 12, 30, 0)
            },
            new WorkNote()
            {
                Id = 1001,
                Title = "I did another thing",
                Content = "Went all right, mostly.  I guess.",
                CreatedDate = new DateTime(2019, 07, 16, 12, 30, 0)
            }
        };

        public WorkNoteService BuildService()
        {
            Mock<IGenericRepository<WorkNote>> mockRepository = new Mock<IGenericRepository<WorkNote>>();
            mockRepository
                .Setup(inst => inst.GetAll())
                .Returns(() => _testData.AsQueryable());
            mockRepository
                .Setup(inst => inst.GetByIdAsync(It.IsAny<int>()))
                .ReturnsAsync((int id) => _testData.Where(item => item.Id == id).SingleOrDefault());
            mockRepository
                .Setup(inst => inst.CreateAsync(It.IsAny<WorkNote>()))
                .Callback((WorkNote newWorkNote) =>
                {
                    newWorkNote.Id = _nextId++;
                    newWorkNote.CreatedDate = DateTime.Now;
                    _testData.Add(newWorkNote);
                });
            mockRepository
                .Setup(inst => inst.UpdateAsync(It.IsAny<WorkNote>()))
                .Callback((WorkNote entry) =>
                {
                    var match = _testData.FirstOrDefault(item => item.Id == entry.Id);
                    if (match == null)
                    {
                        throw new NotFoundException($"Item with id={entry.Id} not found.");
                    }

                    match.Title = entry.Title;
                    match.Content = entry.Content;
                });
            mockRepository
                .Setup(inst => inst.DeleteAsync(It.IsAny<int>()))
                .Callback((int id) =>
                {
                    var match = _testData.FirstOrDefault(item => item.Id == id);
                    if (match == null)
                    {
                        throw new NotFoundException($"Item with id={id} not found.");
                    }

                    _testData = _testData.Where(item => item.Id != id).ToList();
                });

            WorkNoteService service = new WorkNoteService(mockRepository.Object, AutoMapperProfile.MapperFactory());

            return service;
        }

        #region ### ReadAll ####################################################

        [Fact]
        public void ReadAll_HappyPath()
        {
            var service = BuildService();

            IEnumerable<WorkNoteDto> result = service.ReadAllItems(null);

            result.Should()
                .NotBeNull()
                .And
                .HaveCount(2);
        }

        [Fact]
        public void ReadAll_HappyPath_WithDate()
        {
            var service = BuildService();

            IEnumerable<WorkNoteDto> result = service.ReadAllItems(new DateTime(2019, 07, 15, 12, 30, 0));

            result.Should()
                .NotBeNull()
                .And
                .HaveCount(1);
        }

        [Fact]
        public void ReadAll_NoResultsForDate()
        {
            var service = BuildService();

            IEnumerable<WorkNoteDto> result = service.ReadAllItems(new DateTime(2000, 01, 01, 12, 00, 00));

            result.Should()
                .NotBeNull()
                .And
                .HaveCount(0);
        }

        #endregion

        #region ### ReadItem ###################################################

        [Fact]
        public async void ReadItem_HappyPath()
        {
            var service = BuildService();

            WorkNoteDto result = await service.ReadItemAsync(1001);

            result.Should().NotBeNull("Result should not be null");
            result.Title.Should().Be("I did another thing");
            result.Content.Should().Be("Went all right, mostly.  I guess.");
            result.CreatedDate.Year.Should().Be(2019);
        }

        [Fact]
        public async void ReadItem_NoResultForId()
        {
            var service = BuildService();

            WorkNoteDto result = await service.ReadItemAsync(1234);

            result.Should().BeNull();
        }

        #endregion

        #region ### CreateItem #################################################

        [Fact]
        public async void CreateItem_HappyPath()
        {
            var service = BuildService();

            WorkNoteDto result = await service.CreateItemAsync(new WorkNoteDto
            {
                Title = "I did this",
                Content = "No issues found",
            });

            result.Should().NotBeNull();
            result.Id.Should().Be(1002);
            result.Title.Should().Be("I did this");
            result.Content.Should().Be("No issues found");
            result.CreatedDate.Day.Should().Be(DateTime.Today.Day);
        }

        [Fact]
        public async void CreateItem_TrimWhitespace()
        {
            var service = BuildService();

            WorkNoteDto result = await service.CreateItemAsync(new WorkNoteDto
            {
                Title = @" 
        I did this   ",
                Content = @" No issues found   
    ",
            });

            result.Should().NotBeNull();
            result.Id.Should().BeGreaterThan(0);
            result.Title.Should().Be("I did this");
            result.Content.Should().Be("No issues found");
            result.CreatedDate.Day.Should().Be(DateTime.Today.Day);
        }

        [Fact]
        public async void CreateItem_NullContent()
        {
            var service = BuildService();

            WorkNoteDto result = await service.CreateItemAsync(new WorkNoteDto
            {
                Title = "I did this",
                Content = null,
            });

            result.Should().NotBeNull();
            result.Id.Should().BeGreaterThan(0);
            result.Title.Should().Be("I did this");
            result.Content.Should().Be("");
            result.CreatedDate.Day.Should().Be(DateTime.Today.Day);
        }

        [Fact]
        public void CreateItem_Error_TitleNull()
        {
            var service = BuildService();

            var badItem = new WorkNoteDto
            {
                Title = null,
                Content = "No issues found",
            };

            Func<Task<WorkNoteDto>> func = async () => await service.CreateItemAsync(badItem);
            func.Should()
                .Throw<ContentValidationException>();
        }

        [Fact]
        public void CreateItem_Error_TitleEmpty()
        {
            var service = BuildService();

            var badItem = new WorkNoteDto
            {
                Title = "",
                Content = "No issues found",
            };

            Func<Task<WorkNoteDto>> func = async () => await service.CreateItemAsync(badItem);
            func.Should()
                .Throw<ContentValidationException>();
        }

        [Fact]
        public void CreateItem_Error_TitleBlank()
        {
            var service = BuildService();

            var badItem = new WorkNoteDto
            {
                Title = " ",
                Content = "No issues found",
            };

            Func<Task<WorkNoteDto>> func = async () => await service.CreateItemAsync(badItem);
            func.Should()
                .Throw<ContentValidationException>();
        }

        #endregion

        #region ### UpdateItem #################################################

        [Fact]
        public async void UpdateItem_HappyPath()
        {
            var service = BuildService();

            WorkNoteDto result = await service.UpdateItemAsync(new WorkNoteDto
            {
                Id = 1001,
                Title = "Changed",
                Content = "Changed"
            });

            result.Should().NotBeNull();
            result.Id.Should().Be(1001);
            result.Title.Should().Be("Changed");
            result.Content.Should().Be("Changed");
            result.CreatedDate.Year.Should().Be(2019);
        }

        [Fact]
        public async void UpdateItem_TrimWhitespace()
        {
            var service = BuildService();

            WorkNoteDto result = await service.UpdateItemAsync(new WorkNoteDto
            {
                Id = 1001,
                Title = @" 
 Changed   ",
                Content = @" Changed   
",
            });

            result.Should().NotBeNull();
            result.Id.Should().Be(1001);
            result.Title.Should().Be("Changed");
            result.Content.Should().Be("Changed");
            result.CreatedDate.Year.Should().Be(2019);
        }

        [Fact]
        public async void UpdateItem_Error_ContentNull()
        {
            var service = BuildService();

            WorkNoteDto result = await service.UpdateItemAsync(new WorkNoteDto
            {
                Id = 1001,
                Title = "Changed",
                Content = null
            });

            result.Should().NotBeNull();
            result.Id.Should().Be(1001);
            result.Title.Should().Be("Changed");
            result.Content.Should().Be("");
            result.CreatedDate.Year.Should().Be(2019);
        }

        [Fact]
        public void UpdateItem_Error_NotFound()
        {
            var service = BuildService();

            WorkNoteDto badItem = new WorkNoteDto
            {
                Id = 999999,
                Title = "Changed",
                Content = "Changed"
            };

            Func<Task<WorkNoteDto>> func = async () => await service.UpdateItemAsync(badItem);
            func.Should()
                .Throw<NotFoundException>()
                .WithMessage("Item with id=999999 not found.");
        }

        [Fact]
        public void UpdateItem_Error_TitleNull()
        {
            var service = BuildService();

            WorkNoteDto badItem = new WorkNoteDto
            {
                Id = 1001,
                Title = null,
                Content = "Changed"
            };

            Func<Task<WorkNoteDto>> func = async () => await service.UpdateItemAsync(badItem);
            func.Should()
                .Throw<ContentValidationException>()
                .WithMessage("'Title' must not be empty.");
        }

        [Fact]
        public void UpdateItem_Error_TitleEmpty()
        {
            var service = BuildService();

            WorkNoteDto badItem = new WorkNoteDto
            {
                Id = 1001,
                Title = "",
                Content = "Changed"
            };

            Func<Task<WorkNoteDto>> func = async () => await service.UpdateItemAsync(badItem);
            func.Should()
                .Throw<ContentValidationException>()
                .WithMessage("'Title' must not be empty.");
        }

        [Fact]
        public void UpdateItem_Error_TitleBlank()
        {
            var service = BuildService();

            WorkNoteDto badItem = new WorkNoteDto
            {
                Id = 1001,
                Title = "   ",
                Content = "Changed"
            };

            Func<Task<WorkNoteDto>> func = async () => await service.UpdateItemAsync(badItem);
            func.Should()
                .Throw<ContentValidationException>()
                .WithMessage("'Title' must not be empty.");
        }

        #endregion

        #region ### DeleteItem #################################################

        [Fact]
        public async void DeleteItem_HappyPath()
        {
            var service = BuildService();

            int count1 = service.ReadAllItems().Count();
            await service.DeleteItemAsync(1001);
            int count2 = service.ReadAllItems().Count();

            count2.Should().Be(count1 - 1);
        }

        [Fact]
        public void DeleteItem_Error_NotFound()
        {
            var service = BuildService();

            Func<System.Threading.Tasks.Task> func = async () => await service.DeleteItemAsync(999999);
            func.Should()
                .Throw<NotFoundException>()
                .WithMessage("Item with id=999999 not found.");
        }

        #endregion
    }
}
