package com.codingshuttle.projects.airBnbApp.document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.elasticsearch.annotations.Document;
import org.springframework.data.elasticsearch.annotations.Field;
import org.springframework.data.elasticsearch.annotations.FieldType;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(indexName = "hotels", createIndex = false)
public class HotelDocument {

    @Id
    private String id;

    @Field(type = FieldType.Text, analyzer = "english")
    private String name;

    @Field(type = FieldType.Keyword)
    private String city;

    @Field(type = FieldType.Keyword)
    private String state;

    @Field(type = FieldType.Text)
    private String address;

    @Field(type = FieldType.Keyword)
    private List<String> amenities;

    @Field(type = FieldType.Double)
    private double rating;

    @Field(type = FieldType.Double)
    private Double latitude;

    @Field(type = FieldType.Double)
    private Double longitude;

    @Field(type = FieldType.Boolean)
    private boolean active;
}
