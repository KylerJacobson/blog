package dev.kylerjacobson.blog;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@SpringBootApplication
@RestController
public class BlogApplication {

	@RequestMapping("/")
	public String home() {
		return "My Blog from Azure Pipeline";
	}

	public static void main(String[] args) {
		SpringApplication.run(BlogApplication.class, args);
	}

}