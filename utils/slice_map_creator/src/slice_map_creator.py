#!/usr/bin/python
# -*- coding: UTF-8 -*-

class SliceMapCreator:
    def area(self):
        return self.width * self.height
    def __init__(self, area_of_slice, command, filter, path_to_images, images_name_format, path_to_slicemaps, slicemaps_name_format, row_col, slicemap_size, slicemaps_number, slices_range):
		self.area_of_slice = area_of_slice
		self.command = command
		self.filter = filter
		self.path_to_images = path_to_images
		self.images_name_format = images_name_format
		self.path_to_slicemaps = path_to_slicemaps
		self.slicemaps_name_format = slicemaps_name_format
		self.row_col = row_col
		self.slicemap_size = slicemap_size
		self.slicemaps_number = slicemaps_number
		self.slices_range = slices_range